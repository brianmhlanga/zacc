/**
 * The scoring contract, shared verbatim by the browser and the server.
 *
 * This file must stay dependency-free. `shared/` is auto-imported into both
 * `app/` and `server/`, and the whole point of the arrangement is that the
 * candidate's live scorecard and the authoritative score on submit run the same
 * code. An import of `h3`, `prisma` or anything Node-only here would break the
 * client build and quietly force a second implementation into existence.
 */
import type { QualificationLevel } from './qualifications'

export type { QualificationLevel }

export type ScoreBucket =
  | 'QUALIFICATIONS_EXPERIENCE'
  | 'SKILLS'
  | 'INTEGRITY'
  | 'FIT'

export type CriterionType =
  | 'BANDED'
  | 'QUALIFICATION_LADDER'
  | 'KEYWORD'
  | 'BOOLEAN'
  | 'CHOICE'
  | 'MANUAL'

export type DisqualifierType =
  | 'MIN_NUMERIC'
  | 'MAX_NUMERIC'
  | 'REQUIRED_TRUE'
  | 'REQUIRED_FALSE'
  | 'REQUIRED_QUALIFICATION'
  | 'VALUE_IN'
  | 'VALUE_NOT_IN'
  | 'MISSING_DOCUMENT'
  | 'AGE_RANGE'
  | 'CLOSING_DATE'

export type DisqualifierAction = 'AUTO_REJECT' | 'FLAG_ONLY'
export type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type PanelAggregation = 'MEAN' | 'MEDIAN' | 'TRIMMED_MEAN' | 'CHAIR_OVERRIDE'
export type LanguageProficiency = 'NONE' | 'BASIC' | 'GOOD' | 'FLUENT' | 'NATIVE'
export type KeywordSource = 'skills' | 'employment' | 'qualifications' | 'coverLetter'

/** A numeric band. `min`/`max` are inclusive; `null` means unbounded on that side. */
export interface Band {
  label: string
  min: number | null
  max: number | null
  points: number
}

export type CriterionConfig =
  | { kind: 'BANDED'; bands: Band[]; unit?: string }
  | {
      kind: 'QUALIFICATION_LADDER'
      /** Overrides the default ladder points for this vacancy. */
      ladder?: Array<{ level: QualificationLevel; points: number }>
      /** Award extra points for qualifications beyond the highest. */
      creditAdditional?: boolean
      additionalPointsEach?: number
      cap?: number
    }
  | {
      kind: 'KEYWORD'
      required: string[]
      preferred: string[]
      synonyms?: Record<string, string[]>
      /** Share of the criterion's points carried by required vs preferred hits. */
      requiredWeight?: number
      preferredWeight?: number
      sources?: KeywordSource[]
    }
  | { kind: 'BOOLEAN'; truePoints: number; falsePoints: number }
  | { kind: 'CHOICE'; map: Record<string, number>; defaultPoints?: number }
  | { kind: 'MANUAL'; rubric: Array<{ label: string; points: number; guidance?: string }> }

export interface CriterionDef {
  id: string
  key: string
  label: string
  description?: string | null
  bucket: ScoreBucket
  type: CriterionType
  /** Relative weight *within* its bucket. Normalised at scoring time. */
  weight: number
  maxPoints: number
  config: CriterionConfig
  /** Dotted path into the application payload, e.g. "employment.totalYears". */
  sourceField?: string | null
  isAutoScored: boolean
  isPanelScored: boolean
  showToCandidate: boolean
  sortOrder: number
}

export interface DisqualifierDef {
  id: string
  key: string
  label: string
  type: DisqualifierType
  sourceField?: string | null
  config: Record<string, unknown>
  action: DisqualifierAction
  severity: FlagSeverity
  publicReason?: string | null
  internalReason?: string | null
}

/** The wizard payload — identical shape for draft, submit and score. */
export interface ScorableApplication {
  personal: {
    dateOfBirth?: string | null
    gender?: string | null
    province?: string | null
    city?: string | null
    nationality?: string | null
    hasDisability?: boolean | null
  }
  position: {
    jobId: string
    noticePeriodDays?: number | null
    willingToRelocate?: boolean | null
    expectedSalary?: number | null
    howHeard?: string | null
  }
  qualifications: Array<{
    level: QualificationLevel
    fieldOfStudy?: string | null
    institution?: string | null
    yearObtained?: number | null
    classGrade?: string | null
    result?: string | null
  }>
  memberships: Array<{ bodyName: string; status?: string | null }>
  employment: {
    totalYears?: number | null
    isCurrentlyEmployed?: boolean | null
    positions: Array<{
      employer: string
      jobTitle: string
      fromMonth?: string | null
      toMonth?: string | null
      isCurrent?: boolean
      responsibilities?: string | null
    }>
  }
  /** Keyed by declaration key, e.g. "corruption", "criminal", "vetting". */
  declarations: Record<string, { answer: boolean; explanation?: string | null; documentId?: string | null }>
  skills: { raw: string; list: string[] }
  languages: Array<{
    language: string
    read: LanguageProficiency
    write: LanguageProficiency
    speak: LanguageProficiency
  }>
  documents: Array<{ slotKey: string; fileName: string; fileUrl?: string; fileSize?: number }>
  driversLicence?: { has: boolean; class?: string | null; expiry?: string | null } | null
}

export interface ScoringInput {
  vacancy: {
    id: string
    /** Must sum to 100. Missing buckets are treated as weight 0. */
    bucketWeights: Partial<Record<ScoreBucket, number>>
    keywords?: { required: string[]; preferred: string[]; synonyms?: Record<string, string[]> }
    province?: string | null
    dutyStation?: string | null
    minYearsExperience?: number | null
    maxNoticePeriodDays?: number | null
    closingDate?: string | null
    documentSlots?: Array<{ key: string; label: string; isMandatory: boolean }>
    requiresDriversLicence?: boolean
  }
  criteria: CriterionDef[]
  disqualifiers: DisqualifierDef[]
  application: ScorableApplication
  /** Submitted panel scores, keyed by criterion id. */
  panel?: {
    scoresByCriterion: Record<string, number[]>
    aggregation: PanelAggregation
    spreadThreshold: number
  }
  /** Injectable for deterministic tests. */
  now?: string
}

export interface CriterionResult {
  criterionId: string
  key: string
  label: string
  bucket: ScoreBucket
  type: CriterionType
  rawPoints: number
  maxPoints: number
  /** 0–1. */
  normalizedPct: number
  /** Contribution to the 0–100 total. */
  weightedPoints: number
  /** This criterion's share of its bucket, 0–1. */
  bucketSharePct: number
  /** MANUAL criteria with no submitted panel score yet. */
  pending: boolean
  detail: Record<string, unknown>
  explanation: string
}

export interface KeywordMatch {
  keyword: string
  isRequired: boolean
  occurrences: number
  matchedVia?: string
  source?: KeywordSource
}

export interface EvaluatedFlag {
  key: string
  label: string
  severity: FlagSeverity
  action: DisqualifierAction
  detail: string
  publicReason?: string | null
  disqualifierId?: string | null
}

export interface BucketScore {
  bucket: ScoreBucket
  weight: number
  earned: number
  max: number
  /** 0–1. */
  pct: number
}

export interface ScoringResult {
  version: number
  /** 0–100, one decimal. Pending MANUAL criteria are excluded from the denominator. */
  total: number
  /** Same as `total`; kept explicit for readability at call sites. */
  provisionalTotal: number
  /** Pending MANUAL criteria assumed at their rubric midpoint. */
  projectedTotal: number
  bucketScores: BucketScore[]
  criterionResults: CriterionResult[]
  keyword: {
    /** 0–100. */
    percent: number
    matched: KeywordMatch[]
    missed: Array<{ keyword: string; isRequired: boolean }>
  }
  flags: EvaluatedFlag[]
  disqualified: boolean
  disqualificationReasons: EvaluatedFlag[]
  /** Criterion keys still awaiting panel input. */
  manualPending: string[]
  missingMandatoryDocuments: string[]
}
