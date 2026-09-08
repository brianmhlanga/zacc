/**
 * The scoring engine.
 *
 * `scoreApplication` is pure and synchronous. That one property is what lets the
 * candidate's live scorecard recompute on every keystroke with no network call,
 * while the server runs the identical function to produce the authoritative score
 * on submit. Any impurity here — a clock read, a database lookup, a random
 * number — would let the two diverge, and the divergence would be silent: a
 * candidate shown 74 who is filed at 68.
 *
 * The impure adapter that loads criteria from Prisma and persists results lives in
 * `server/utils/recruitmentScoring.ts`.
 */
import type {
  BucketScore,
  CriterionDef,
  CriterionResult,
  DisqualifierDef,
  EvaluatedFlag,
  ScoreBucket,
  ScoringInput,
  ScoringResult
} from './types'
import { buildKeywordSources, matchKeywords } from './keywords'
import { highestQualification, meetsQualification, qualificationPoints } from './qualifications'

export const SCORING_ENGINE_VERSION = 1

const BUCKETS: ScoreBucket[] = ['QUALIFICATIONS_EXPERIENCE', 'SKILLS', 'INTEGRITY', 'FIT']

const round1 = (n: number) => Math.round(n * 10) / 10
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/** Reads a dotted path such as "employment.totalYears" out of the payload. */
export function readPath(obj: unknown, path?: string | null): unknown {
  if (!path) return undefined
  return path
    .split('.')
    .reduce<any>((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), obj)
}

function readNumber(obj: unknown, path?: string | null): number | null {
  const raw = readPath(obj, path)
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function readBoolean(obj: unknown, path?: string | null): boolean | null {
  const raw = readPath(obj, path)
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw === 'boolean') return raw
  if (raw === 'true' || raw === 'Yes' || raw === 'yes') return true
  if (raw === 'false' || raw === 'No' || raw === 'no') return false
  return null
}

function emptyResult(c: CriterionDef, explanation: string, pending = false): CriterionResult {
  return {
    criterionId: c.id,
    key: c.key,
    label: c.label,
    bucket: c.bucket,
    type: c.type,
    rawPoints: 0,
    maxPoints: c.maxPoints,
    normalizedPct: 0,
    weightedPoints: 0,
    bucketSharePct: 0,
    pending,
    detail: {},
    explanation
  }
}

// ---------------------------------------------------------------------------
// Per-criterion evaluation
// ---------------------------------------------------------------------------

function evaluateCriterion(c: CriterionDef, input: ScoringInput): CriterionResult {
  const app = input.application
  const config = c.config

  switch (config.kind) {
    case 'BANDED': {
      const value = readNumber(app, c.sourceField)
      if (value === null) return emptyResult(c, 'Not provided')

      const band = config.bands.find(
        (b) => (b.min === null || value >= b.min) && (b.max === null || value <= b.max)
      )
      if (!band) {
        return {
          ...emptyResult(c, `${value}${config.unit ? ' ' + config.unit : ''} falls outside every configured band`),
          detail: { value }
        }
      }
      const pct = clamp01(c.maxPoints > 0 ? band.points / c.maxPoints : 0)
      return {
        ...emptyResult(c, `${band.label} → ${band.points}/${c.maxPoints}`),
        rawPoints: band.points,
        normalizedPct: pct,
        detail: { value, band: band.label, unit: config.unit ?? null }
      }
    }

    case 'QUALIFICATION_LADDER': {
      const levels = (app.qualifications ?? []).map((q) => q.level)
      const highest = highestQualification(levels)
      if (!highest) return emptyResult(c, 'No qualification recorded')

      const override = config.ladder?.find((l) => l.level === highest)
      let points = override ? override.points : qualificationPoints(highest)

      // Optional credit for breadth beyond the highest attained.
      if (config.creditAdditional && levels.length > 1) {
        const each = config.additionalPointsEach ?? 0
        const extra = each * (new Set(levels).size - 1)
        points += config.cap !== undefined ? Math.min(extra, config.cap) : extra
      }
      points = Math.min(points, c.maxPoints)

      return {
        ...emptyResult(c, `Highest qualification → ${points}/${c.maxPoints}`),
        rawPoints: points,
        normalizedPct: clamp01(c.maxPoints > 0 ? points / c.maxPoints : 0),
        detail: { highest, levelCount: new Set(levels).size }
      }
    }

    case 'KEYWORD': {
      const result = matchKeywords({
        required: config.required ?? [],
        preferred: config.preferred ?? [],
        synonyms: config.synonyms,
        requiredWeight: config.requiredWeight,
        sources: buildKeywordSources({
          skills: app.skills,
          employment: app.employment,
          qualifications: app.qualifications
        })
      })
      const pct = clamp01(result.percent / 100)
      return {
        ...emptyResult(
          c,
          `${result.requiredMatched}/${result.requiredTotal} required and ${result.preferredMatched}/${result.preferredTotal} preferred keywords matched`
        ),
        rawPoints: round1(pct * c.maxPoints),
        normalizedPct: pct,
        detail: {
          percent: result.percent,
          matched: result.matched.map((m) => m.keyword),
          missed: result.missed.map((m) => m.keyword)
        }
      }
    }

    case 'BOOLEAN': {
      const value = readBoolean(app, c.sourceField)
      if (value === null) return emptyResult(c, 'Not answered')
      const points = Math.min(value ? config.truePoints : config.falsePoints, c.maxPoints)
      return {
        ...emptyResult(c, `${value ? 'Yes' : 'No'} → ${points}/${c.maxPoints}`),
        rawPoints: points,
        normalizedPct: clamp01(c.maxPoints > 0 ? points / c.maxPoints : 0),
        detail: { value }
      }
    }

    case 'CHOICE': {
      const raw = readPath(app, c.sourceField)
      if (raw === null || raw === undefined || raw === '') return emptyResult(c, 'Not selected')
      const key = String(raw)
      const points = Math.min(config.map[key] ?? config.defaultPoints ?? 0, c.maxPoints)
      return {
        ...emptyResult(c, `${key} → ${points}/${c.maxPoints}`),
        rawPoints: points,
        normalizedPct: clamp01(c.maxPoints > 0 ? points / c.maxPoints : 0),
        detail: { value: key, matched: key in config.map }
      }
    }

    case 'MANUAL': {
      const submitted = input.panel?.scoresByCriterion?.[c.id]
      if (!submitted || submitted.length === 0) {
        return emptyResult(c, 'Awaiting panel assessment', true)
      }
      const avg = submitted.reduce((a, b) => a + b, 0) / submitted.length
      const points = Math.min(avg, c.maxPoints)
      return {
        ...emptyResult(c, `Panel assessment (${submitted.length} reviewer${submitted.length > 1 ? 's' : ''}) → ${round1(points)}/${c.maxPoints}`),
        rawPoints: round1(points),
        normalizedPct: clamp01(c.maxPoints > 0 ? points / c.maxPoints : 0),
        detail: { reviewerCount: submitted.length, scores: submitted }
      }
    }

    default:
      return emptyResult(c, 'Unknown criterion type')
  }
}

// ---------------------------------------------------------------------------
// Disqualifiers
// ---------------------------------------------------------------------------

function evaluateDisqualifier(d: DisqualifierDef, input: ScoringInput): EvaluatedFlag | null {
  const app = input.application
  const cfg = d.config as Record<string, any>
  const flag = (detail: string): EvaluatedFlag => ({
    key: d.key,
    label: d.label,
    severity: d.severity,
    action: d.action,
    detail,
    publicReason: d.publicReason ?? null,
    disqualifierId: d.id
  })

  switch (d.type) {
    case 'MIN_NUMERIC': {
      const v = readNumber(app, d.sourceField)
      if (v === null) return cfg.failWhenMissing ? flag('Required value not provided') : null
      return v < Number(cfg.value) ? flag(`${v} is below the minimum of ${cfg.value}`) : null
    }
    case 'MAX_NUMERIC': {
      const v = readNumber(app, d.sourceField)
      if (v === null) return cfg.failWhenMissing ? flag('Required value not provided') : null
      return v > Number(cfg.value) ? flag(`${v} exceeds the maximum of ${cfg.value}`) : null
    }
    case 'REQUIRED_TRUE': {
      const v = readBoolean(app, d.sourceField)
      return v === true ? null : flag(cfg.detail ?? 'Required confirmation not given')
    }
    case 'REQUIRED_FALSE': {
      const v = readBoolean(app, d.sourceField)
      return v === false ? null : flag(cfg.detail ?? 'Adverse declaration recorded')
    }
    case 'REQUIRED_QUALIFICATION': {
      const highest = highestQualification((app.qualifications ?? []).map((q) => q.level))
      return meetsQualification(highest, cfg.level)
        ? null
        : flag(`Highest qualification does not meet the required ${cfg.level}`)
    }
    case 'VALUE_IN': {
      const v = readPath(app, d.sourceField)
      const list: string[] = cfg.values ?? []
      return list.includes(String(v)) ? null : flag(`"${String(v)}" is not an accepted value`)
    }
    case 'VALUE_NOT_IN': {
      const v = readPath(app, d.sourceField)
      const list: string[] = cfg.values ?? []
      return list.includes(String(v)) ? flag(`"${String(v)}" is an excluded value`) : null
    }
    case 'MISSING_DOCUMENT': {
      const required: string[] = cfg.slotKeys ?? []
      const present = new Set((app.documents ?? []).map((doc) => doc.slotKey))
      const missing = required.filter((k) => !present.has(k))
      return missing.length ? flag(`Missing required document(s): ${missing.join(', ')}`) : null
    }
    case 'AGE_RANGE': {
      const dob = app.personal?.dateOfBirth
      if (!dob) return cfg.failWhenMissing ? flag('Date of birth not provided') : null
      const age = ageAt(dob, input.now)
      if (age === null) return null
      if (cfg.min !== undefined && age < Number(cfg.min)) return flag(`Age ${age} is below the minimum of ${cfg.min}`)
      if (cfg.max !== undefined && age > Number(cfg.max)) return flag(`Age ${age} is above the maximum of ${cfg.max}`)
      return null
    }
    case 'CLOSING_DATE': {
      const closing = input.vacancy.closingDate
      if (!closing || !input.now) return null
      return new Date(input.now) > new Date(closing) ? flag('Submitted after the closing date') : null
    }
    default:
      return null
  }
}

/** Whole years between a date of birth and `now` (or the epoch-free default). */
export function ageAt(dateOfBirth: string, now?: string): number | null {
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const ref = now ? new Date(now) : new Date()
  if (Number.isNaN(ref.getTime())) return null
  let age = ref.getFullYear() - dob.getFullYear()
  const m = ref.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--
  return age
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function scoreApplication(input: ScoringInput): ScoringResult {
  const criteria = [...(input.criteria ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  // 1. Evaluate every criterion independently.
  const criterionResults = criteria.map((c) => evaluateCriterion(c, input))
  const byId = new Map(criteria.map((c) => [c.id, c]))

  // 2. Normalise weights *within* each bucket, then apply the bucket weight.
  //    Weights are relative, so a bucket with criteria weighted 1/1/2 splits
  //    25%/25%/50% of that bucket regardless of the absolute numbers used.
  const bucketScores: BucketScore[] = []

  for (const bucket of BUCKETS) {
    const bucketWeight = Number(input.vacancy.bucketWeights?.[bucket] ?? 0)
    const inBucket = criterionResults.filter((r) => r.bucket === bucket)
    if (!inBucket.length || bucketWeight <= 0) {
      if (bucketWeight > 0) {
        bucketScores.push({ bucket, weight: bucketWeight, earned: 0, max: bucketWeight, pct: 0 })
      }
      continue
    }

    // Pending MANUAL criteria are excluded from the denominator rather than
    // scored zero — an unreviewed application is incomplete, not bad.
    const resolved = inBucket.filter((r) => !r.pending)
    const totalWeight = resolved.reduce((sum, r) => sum + (byId.get(r.criterionId)?.weight ?? 0), 0)

    let earned = 0
    for (const r of inBucket) {
      const weight = byId.get(r.criterionId)?.weight ?? 0
      const share = !r.pending && totalWeight > 0 ? weight / totalWeight : 0
      r.bucketSharePct = share
      r.weightedPoints = round1(r.normalizedPct * share * bucketWeight)
      earned += r.weightedPoints
    }

    bucketScores.push({
      bucket,
      weight: bucketWeight,
      earned: round1(earned),
      max: bucketWeight,
      pct: bucketWeight > 0 ? clamp01(earned / bucketWeight) : 0
    })
  }

  // 3. Keyword summary for the sidebar, independent of whether a KEYWORD
  //    criterion exists — the vacancy's keyword set drives the chips either way.
  const kw = input.vacancy.keywords
  const keywordResult = kw
    ? matchKeywords({
        required: kw.required ?? [],
        preferred: kw.preferred ?? [],
        synonyms: kw.synonyms,
        sources: buildKeywordSources({
          skills: input.application.skills,
          employment: input.application.employment,
          qualifications: input.application.qualifications
        })
      })
    : { matched: [], missed: [], percent: 0, requiredMatched: 0, requiredTotal: 0, preferredMatched: 0, preferredTotal: 0 }

  // 4. Disqualifiers and flags.
  const flags: EvaluatedFlag[] = []
  for (const d of input.disqualifiers ?? []) {
    const hit = evaluateDisqualifier(d, input)
    if (hit) flags.push(hit)
  }
  const disqualificationReasons = flags.filter((f) => f.action === 'AUTO_REJECT')

  // 5. Missing mandatory documents — surfaced separately so the wizard can point
  //    at the specific tile rather than just refusing to submit.
  const present = new Set((input.application.documents ?? []).map((d) => d.slotKey))
  const missingMandatoryDocuments = (input.vacancy.documentSlots ?? [])
    .filter((s) => s.isMandatory && !present.has(s.key))
    .map((s) => s.key)

  // 6. Totals.
  const total = round1(bucketScores.reduce((sum, b) => sum + b.earned, 0))

  const manualPending = criterionResults.filter((r) => r.pending)
  const projectedTotal = round1(
    total +
      manualPending.reduce((sum, r) => {
        const c = byId.get(r.criterionId)
        if (!c || c.config.kind !== 'MANUAL') return sum
        const bucketWeight = Number(input.vacancy.bucketWeights?.[c.bucket] ?? 0)
        const rubric = c.config.rubric ?? []
        const midpoint = rubric.length
          ? rubric.reduce((a, b) => a + b.points, 0) / rubric.length / (c.maxPoints || 1)
          : 0.5
        // Rough: assumes the pending criterion would take an even share of its bucket.
        const inBucket = criterionResults.filter((x) => x.bucket === c.bucket).length || 1
        return sum + midpoint * (bucketWeight / inBucket)
      }, 0)
  )

  return {
    version: SCORING_ENGINE_VERSION,
    total,
    provisionalTotal: total,
    projectedTotal,
    bucketScores,
    criterionResults,
    keyword: {
      percent: keywordResult.percent,
      matched: keywordResult.matched,
      missed: keywordResult.missed
    },
    flags,
    disqualified: disqualificationReasons.length > 0,
    disqualificationReasons,
    manualPending: manualPending.map((r) => r.key),
    missingMandatoryDocuments
  }
}
