/**
 * Plain-English descriptions of a scoring criterion.
 *
 * Two jobs. The first is a live preview in the builder: restating a rule in a
 * sentence is the cheapest correctness check there is on something someone has
 * just configured, and it catches inverted bands and empty keyword sets before
 * any applicant is scored by them.
 *
 * The second is flagging criteria that score a protected characteristic, so the
 * warning appears in the tool that creates them rather than in a policy document
 * nobody opens.
 */
import { qualificationLabel } from './qualifications'
import type { QualificationLevel } from './qualifications'

export interface DescribableCriterion {
  label?: string | null
  type?: string | null
  maxPoints?: number | null
  sourceField?: string | null
  config?: any
}

/** Application fields that carry a protected characteristic. */
const DEMOGRAPHIC_FIELDS = [
  'personal.gender',
  'personal.dateOfBirth',
  'personal.age',
  'personal.hasDisability',
  'personal.nationality'
] as const

export function isDemographicField(sourceField?: string | null): boolean {
  if (!sourceField) return false
  return DEMOGRAPHIC_FIELDS.some((f) => sourceField === f || sourceField.startsWith(`${f}.`))
}

/**
 * Words that name a protected characteristic. Needed alongside the field check
 * because a MANUAL criterion has no source field at all — someone can title one
 * "Age suitability" and the field check would never see it.
 *
 * Deliberately matched on whole words: "management" contains "age".
 */
const DEMOGRAPHIC_WORDS = [
  'age', 'ages', 'gender', 'sex', 'male', 'female', 'marital', 'married',
  'pregnan', 'pregnancy', 'disability', 'disabled', 'race', 'tribe', 'ethnic',
  'ethnicity', 'religion', 'religious', 'nationality', 'citizenship'
]

export function isDemographicCriterion(c: DescribableCriterion): boolean {
  if (isDemographicField(c?.sourceField)) return true
  const words = String(c?.label ?? '').toLowerCase().split(/[^a-z]+/).filter(Boolean)
  return words.some((w) => DEMOGRAPHIC_WORDS.includes(w) || w.startsWith('pregnan'))
}

function formatBand(b: { min?: number | null; max?: number | null; points?: number | null }): string {
  const min = b.min ?? 0
  const range = b.max === null || b.max === undefined ? `${min}+` : `${min}–${b.max}`
  return `${range} → +${b.points ?? 0}`
}

/**
 * One sentence describing what the criterion does, or an empty string when it is
 * not yet complete enough to describe — which doubles as the "is this ready"
 * signal for the builder.
 */
export function describeCriterion(c: DescribableCriterion): string {
  if (!c?.label?.trim()) return ''
  const kind = c.config?.kind ?? c.type
  const max = c.maxPoints ?? 100

  switch (kind) {
    case 'BANDED': {
      const bands = Array.isArray(c.config?.bands) ? c.config.bands : []
      if (!bands.length) return ''
      const best = bands.reduce((m: number, b: any) => Math.max(m, Number(b?.points) || 0), 0)
      const unit = c.config?.unit ? ` ${c.config.unit}` : ''
      return `Awards points by${unit} band — ${bands.length} tier(s), best of ${best} out of ${max}. ${bands.map(formatBand).join(', ')}.`
    }

    case 'QUALIFICATION_LADDER': {
      const ladder = Array.isArray(c.config?.ladder) ? c.config.ladder : []
      if (!ladder.length) return ''
      const top = ladder.reduce(
        (best: any, r: any) => ((Number(r?.points) || 0) > (Number(best?.points) || 0) ? r : best),
        ladder[0]
      )
      if (!top?.level) return ''
      return `Awards points for the highest qualification attained — up to ${top.points ?? 0} for ${qualificationLabel(top.level as QualificationLevel)}.`
    }

    case 'KEYWORD': {
      const required = c.config?.required ?? []
      const preferred = c.config?.preferred ?? []
      if (!required.length && !preferred.length) return ''
      const parts: string[] = []
      if (required.length) parts.push(`${required.length} required`)
      if (preferred.length) parts.push(`${preferred.length} preferred`)
      return `Matches the application text against ${parts.join(' and ')} keyword(s), scaled to ${max} points.`
    }

    case 'BOOLEAN': {
      const t = c.config?.truePoints ?? 0
      const f = c.config?.falsePoints ?? 0
      return `Awards ${t} points for yes and ${f} for no.`
    }

    case 'CHOICE': {
      const map = c.config?.map ?? {}
      const keys = Object.keys(map)
      if (!keys.length) return ''
      const best = Math.max(...keys.map((k) => Number(map[k]) || 0))
      return `Awards points by value — ${keys.length} option(s), best of ${best} out of ${max}.`
    }

    case 'MANUAL': {
      const rubric = Array.isArray(c.config?.rubric) ? c.config.rubric : []
      if (!rubric.length) return ''
      const best = rubric.reduce((m: number, r: any) => Math.max(m, Number(r?.points) || 0), 0)
      return `Scored by the panel against ${rubric.length} rubric level(s), up to ${best} points. Excluded from the total until reviewers submit.`
    }

    default:
      return ''
  }
}

/** The maximum this criterion can actually award, which is not always maxPoints. */
export function criterionCeiling(c: DescribableCriterion): number {
  const kind = c.config?.kind ?? c.type
  if (kind === 'BANDED') {
    const bands = Array.isArray(c.config?.bands) ? c.config.bands : []
    return bands.reduce((m: number, b: any) => Math.max(m, Number(b?.points) || 0), 0)
  }
  if (kind === 'MANUAL') {
    const rubric = Array.isArray(c.config?.rubric) ? c.config.rubric : []
    return rubric.reduce((m: number, r: any) => Math.max(m, Number(r?.points) || 0), 0)
  }
  if (kind === 'QUALIFICATION_LADDER') {
    const ladder = Array.isArray(c.config?.ladder) ? c.config.ladder : []
    return ladder.reduce((m: number, r: any) => Math.max(m, Number(r?.points) || 0), 0)
  }
  if (kind === 'BOOLEAN') {
    return Math.max(Number(c.config?.truePoints) || 0, Number(c.config?.falsePoints) || 0)
  }
  if (kind === 'CHOICE') {
    const map = c.config?.map ?? {}
    const values = Object.values(map).map((v) => Number(v) || 0)
    return values.length ? Math.max(...values) : 0
  }
  return Number(c.maxPoints) || 0
}

/** Compact read-mode chips for a banded criterion: `0–2 → +20`. */
export function bandChips(c: DescribableCriterion): string[] {
  const bands = Array.isArray(c.config?.bands) ? c.config.bands : []
  return bands.map(formatBand)
}

/**
 * The rule at a glance, for a collapsed row. Every criterion type gets chips so
 * a reviewer can audit a whole scheme without expanding a single card — which is
 * the only way anyone actually checks one.
 */
export function summaryChips(c: DescribableCriterion): string[] {
  const kind = c.config?.kind ?? c.type
  switch (kind) {
    case 'BANDED':
      return bandChips(c)
    case 'QUALIFICATION_LADDER':
      return (Array.isArray(c.config?.ladder) ? c.config.ladder : [])
        .filter((r: any) => (Number(r?.points) || 0) > 0)
        .map((r: any) => `${qualificationLabel(r.level)} → +${r.points}`)
    case 'KEYWORD':
      return [
        ...(c.config?.required ?? []).map((k: string) => `${k} (required)`),
        ...(c.config?.preferred ?? []).map((k: string) => String(k))
      ]
    case 'BOOLEAN':
      return [`Yes → +${c.config?.truePoints ?? 0}`, `No → +${c.config?.falsePoints ?? 0}`]
    case 'CHOICE':
      return Object.entries(c.config?.map ?? {}).map(([k, v]) => `${k} → +${Number(v) || 0}`)
    case 'MANUAL':
      return (Array.isArray(c.config?.rubric) ? c.config.rubric : [])
        .map((r: any) => `${r.label || 'Unnamed'} → +${r.points ?? 0}`)
    default:
      return []
  }
}
