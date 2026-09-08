/**
 * The impure half of the scoring engine.
 *
 * Loads a vacancy's scheme from the database, maps it onto the pure
 * `scoreApplication` contract, and persists the results. The arithmetic itself
 * lives in `shared/recruitment/scoring.ts` and is deliberately untouched by
 * anything in this file — that is what lets the candidate's browser compute the
 * identical number without a round trip.
 */
import { prisma } from './prisma'
import { scoreApplication } from '../../shared/recruitment/scoring'
import {
  aggregatePanelScores,
  collapseToReviewerEntries,
  type PanelScoreEntry
} from '../../shared/recruitment/panel'
import type {
  CriterionDef,
  DisqualifierDef,
  ScorableApplication,
  ScoringInput,
  ScoringResult
} from '../../shared/recruitment/types'

/** Bucket weights used when a vacancy has not configured its own. */
export const DEFAULT_BUCKET_WEIGHTS = {
  QUALIFICATIONS_EXPERIENCE: 40,
  SKILLS: 30,
  INTEGRITY: 20,
  FIT: 10
} as const

type JobWithScheme = {
  id: string
  closingDate: Date
  province: string | null
  dutyStation: string | null
  minYearsExperience: number | null
  maxNoticePeriodDays: number | null
  bucketWeights: unknown
  keywords: unknown
  panelAggregation: string
  panelSpreadThreshold: number
  criteria: Array<Record<string, any>>
  disqualifiers: Array<Record<string, any>>
  documentSlots: Array<Record<string, any>>
}

/** Loads a vacancy with everything the engine needs, in one query. */
export async function loadVacancyScheme(jobId: string): Promise<JobWithScheme | null> {
  return (await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      closingDate: true,
      province: true,
      dutyStation: true,
      minYearsExperience: true,
      maxNoticePeriodDays: true,
      bucketWeights: true,
      keywords: true,
      panelAggregation: true,
      panelSpreadThreshold: true,
      criteria: { orderBy: { sortOrder: 'asc' } },
      disqualifiers: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      documentSlots: { orderBy: { sortOrder: 'asc' } }
    }
  })) as JobWithScheme | null
}

function toCriterionDef(row: Record<string, any>): CriterionDef {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    bucket: row.bucket,
    type: row.type,
    weight: Number(row.weight ?? 1),
    maxPoints: Number(row.maxPoints ?? 100),
    config: row.config,
    sourceField: row.sourceField,
    isAutoScored: Boolean(row.isAutoScored),
    isPanelScored: Boolean(row.isPanelScored),
    showToCandidate: Boolean(row.showToCandidate),
    sortOrder: Number(row.sortOrder ?? 0)
  }
}

function toDisqualifierDef(row: Record<string, any>): DisqualifierDef {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    type: row.type,
    sourceField: row.sourceField,
    config: (row.config ?? {}) as Record<string, unknown>,
    action: row.action,
    severity: row.severity,
    publicReason: row.publicReason,
    internalReason: row.internalReason
  }
}

/** Builds the engine input. Exported so the form-schema endpoint can reuse it. */
export function buildScoringInput(opts: {
  job: JobWithScheme
  application: ScorableApplication
  panelScores?: Record<string, number[]>
  now?: Date
}): ScoringInput {
  const { job } = opts
  const weights = (job.bucketWeights as Record<string, number> | null) ?? DEFAULT_BUCKET_WEIGHTS
  const keywords = (job.keywords as { required?: string[]; preferred?: string[]; synonyms?: Record<string, string[]> } | null) ?? null

  return {
    vacancy: {
      id: job.id,
      bucketWeights: weights as any,
      keywords: keywords
        ? {
            required: keywords.required ?? [],
            preferred: keywords.preferred ?? [],
            synonyms: keywords.synonyms
          }
        : undefined,
      province: job.province,
      dutyStation: job.dutyStation,
      minYearsExperience: job.minYearsExperience,
      maxNoticePeriodDays: job.maxNoticePeriodDays,
      closingDate: job.closingDate?.toISOString() ?? null,
      documentSlots: (job.documentSlots ?? []).map((s) => ({
        key: s.key,
        label: s.label,
        isMandatory: Boolean(s.isMandatory)
      }))
    },
    criteria: (job.criteria ?? []).map(toCriterionDef),
    disqualifiers: (job.disqualifiers ?? []).map(toDisqualifierDef),
    application: opts.application,
    panel: opts.panelScores
      ? {
          scoresByCriterion: opts.panelScores,
          aggregation: job.panelAggregation as any,
          spreadThreshold: Number(job.panelSpreadThreshold ?? 20)
        }
      : undefined,
    now: (opts.now ?? new Date()).toISOString()
  }
}

/**
 * Submitted panel scores for an application, in the two shapes that need them.
 *
 * `byCriterion` feeds each MANUAL criterion its own reviewers' scores.
 * `entries` feeds the panel aggregate, and carries **one entry per reviewer** —
 * see `collapseToReviewerEntries`. Returning the raw per-criterion rows here
 * made the aggregate compare questions with each other instead of reviewers,
 * which inflated spread and flagged agreeing panels as disagreeing.
 */
export async function loadPanelScores(applicationId: string): Promise<{
  byCriterion: Record<string, number[]>
  entries: PanelScoreEntry[]
}> {
  const rows = await prisma.applicationPanelScore.findMany({
    where: { applicationId, isSubmitted: true },
    select: {
      criterionId: true,
      reviewerId: true,
      points: true,
      maxPoints: true,
      application: { select: { jobId: true } }
    }
  })

  const byCriterion: Record<string, number[]> = {}
  for (const r of rows) {
    ;(byCriterion[r.criterionId] ??= []).push(Number(r.points))
  }

  // Who chairs this panel. Without it CHAIR_OVERRIDE has nothing to identify the
  // chair by and silently falls back to the mean — a configured aggregation
  // quietly doing something else.
  const jobId = rows[0]?.application?.jobId
  const chairIds = jobId
    ? new Set(
        (await prisma.vacancyPanelMember.findMany({
          where: { jobId, role: 'CHAIR' },
          select: { userId: true }
        })).map((m: { userId: string }) => m.userId)
      )
    : new Set<string>()

  return {
    byCriterion,
    entries: collapseToReviewerEntries(
      rows.map((r) => ({
        reviewerId: r.reviewerId,
        criterionId: r.criterionId,
        points: Number(r.points),
        maxPoints: Number(r.maxPoints),
        isChair: chairIds.has(r.reviewerId)
      }))
    )
  }
}

export interface ScoreAndPersistResult {
  result: ScoringResult
  finalScore: number
  autoRejected: boolean
}

/**
 * Recomputes an application's score and writes the whole result set atomically.
 *
 * Atomic because a half-written score is worse than no score: the console sorts
 * on `finalScore`, so an application with a fresh total but stale per-criterion
 * rows would look explainable and be wrong. This is the first real consumer of
 * the `$transaction` repair in `server/utils/prisma.ts`.
 */
export async function scoreAndPersist(
  applicationId: string,
  opts: { now?: Date; useSnapshot?: boolean } = {}
): Promise<ScoreAndPersistResult | null> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      jobId: true,
      answers: true,
      schemeSnapshot: true,
      scoreOverride: true
    }
  })
  if (!application?.answers) return null

  const job = await loadVacancyScheme(application.jobId)
  if (!job) return null

  const panel = await loadPanelScores(applicationId)

  const input = buildScoringInput({
    job,
    application: application.answers as unknown as ScorableApplication,
    panelScores: panel.byCriterion,
    now: opts.now
  })

  const result = scoreApplication(input)

  const panelAggregate = panel.entries.length
    ? aggregatePanelScores(
        panel.entries,
        job.panelAggregation as any,
        Number(job.panelSpreadThreshold ?? 20)
      )
    : null

  // A manual override always wins — it exists so a panel can correct the engine.
  const finalScore =
    application.scoreOverride !== null && application.scoreOverride !== undefined
      ? Number(application.scoreOverride)
      : result.total

  await prisma.$transaction(
    async (tx: any) => {
      // Per-criterion rows: replaced wholesale, since the scheme may have changed.
      await tx.applicationCriterionScore.deleteMany({ where: { applicationId } })
      if (result.criterionResults.length) {
        await tx.applicationCriterionScore.createMany({
          data: result.criterionResults.map((r) => ({
            applicationId,
            criterionId: r.criterionId,
            criterionKey: r.key,
            bucket: r.bucket,
            rawPoints: r.rawPoints,
            maxPoints: r.maxPoints,
            normalizedPct: r.normalizedPct,
            weightedPoints: r.weightedPoints,
            pending: r.pending,
            detail: r.detail as any,
            explanation: r.explanation
          }))
        })
      }

      await tx.applicationKeywordHit.deleteMany({ where: { applicationId } })
      const hits = [
        ...result.keyword.matched.map((m) => ({
          applicationId,
          keyword: m.keyword,
          isRequired: m.isRequired,
          matched: true,
          occurrences: m.occurrences,
          matchedVia: m.matchedVia ?? null,
          source: m.source ?? null
        })),
        ...result.keyword.missed.map((m) => ({
          applicationId,
          keyword: m.keyword,
          isRequired: m.isRequired,
          matched: false,
          occurrences: 0,
          matchedVia: null,
          source: null
        }))
      ]
      if (hits.length) await tx.applicationKeywordHit.createMany({ data: hits })

      // Flags raised by the engine are replaced; flags a human resolved are kept.
      await tx.applicationFlag.deleteMany({
        where: { applicationId, status: 'OPEN', disqualifierId: { not: null } }
      })
      if (result.flags.length) {
        await tx.applicationFlag.createMany({
          data: result.flags.map((f) => ({
            applicationId,
            disqualifierId: f.disqualifierId ?? null,
            code: f.key,
            label: f.label,
            severity: f.severity,
            status: 'OPEN',
            causedReject: f.action === 'AUTO_REJECT',
            detail: f.detail,
            publicReason: f.publicReason ?? null
          }))
        })
      }

      await tx.jobApplication.update({
        where: { id: applicationId },
        data: {
          autoScore: result.total,
          finalScore,
          keywordMatchPct: result.keyword.percent,
          scoreComputedAt: new Date(),
          scoringVersion: result.version,
          integrityFlagCount: result.flags.length,
          isAutoRejected: result.disqualified,
          autoRejectReasons: result.disqualified
            ? (result.disqualificationReasons as any)
            : null,
          panelReviewCount: panelAggregate?.count ?? 0,
          panelScoreMean: panelAggregate?.mean ?? null,
          panelScoreMedian: panelAggregate?.median ?? null,
          panelScoreSpread: panelAggregate?.spread ?? null,
          panelScoreStdev: panelAggregate?.stdev ?? null
        }
      })
    },
    // Several createMany calls on a large scheme can exceed the 5s default.
    { timeout: 20_000, maxWait: 5_000 }
  )

  return { result, finalScore, autoRejected: result.disqualified }
}
