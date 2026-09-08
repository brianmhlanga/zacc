/**
 * The shortlisting console's filter, in one place.
 *
 * The console and its CSV export both build this. When they built it separately
 * "the export matches what I am looking at" was a claim someone had to keep true
 * by hand across two files; here it is true by construction.
 *
 * Takes the raw query object rather than a parsed one so it can be tested
 * without Prisma or an H3 event, and so the browser's own query string round-trips
 * through it unchanged.
 */

export interface ApplicationQuery {
  jobId?: unknown
  stageId?: unknown
  status?: unknown
  gender?: unknown
  province?: unknown
  highestQualification?: unknown
  includeAutoRejected?: unknown
  includeWithdrawn?: unknown
  shortlistedOnly?: unknown
  flaggedOnly?: unknown
  minScore?: unknown
  maxScore?: unknown
  search?: unknown
  [key: string]: unknown
}

/** Query values arrive as strings; `true` is the only value that means true. */
const isTrue = (v: unknown) => String(v) === 'true' || v === true

/**
 * `Number('')` is 0, not NaN. Without this guard a cleared score box arrives as
 * `?minScore=` and becomes `finalScore >= 0` — which reads as harmless and is
 * not: `null >= 0` is false in SQL, so it silently drops every application that
 * has not been scored yet.
 */
const numberOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || String(v).trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function buildApplicationWhere(q: ApplicationQuery): Record<string, any> {
  const where: any = {}

  if (q.jobId) where.jobId = String(q.jobId)
  if (q.stageId) where.stageId = String(q.stageId)
  if (q.status) where.status = String(q.status)
  if (q.gender) where.gender = String(q.gender)
  if (q.province) where.province = String(q.province)
  if (q.highestQualification) where.highestQualification = String(q.highestQualification)

  // Default to hiding the noise: auto-rejected and withdrawn are excluded
  // unless explicitly asked for, mirroring the console's own toggles.
  if (!isTrue(q.includeAutoRejected)) where.isAutoRejected = false
  if (!isTrue(q.includeWithdrawn)) where.isWithdrawn = false
  if (isTrue(q.shortlistedOnly)) where.isShortlisted = true
  if (isTrue(q.flaggedOnly)) where.integrityFlagCount = { gt: 0 }

  const minScore = numberOrNull(q.minScore)
  const maxScore = numberOrNull(q.maxScore)
  if (minScore !== null || maxScore !== null) {
    where.finalScore = {}
    if (minScore !== null) where.finalScore.gte = minScore
    if (maxScore !== null) where.finalScore.lte = maxScore
  }

  const search = String(q.search ?? '').trim()
  if (search) {
    where.OR = [
      { referenceNumber: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { name: { contains: search } },
      { email: { contains: search } }
    ]
  }

  return where
}

/** Human-readable restatement of the filter, for the export's audit row. */
export function describeApplicationFilter(q: ApplicationQuery): string {
  const parts: string[] = []
  if (q.jobId) parts.push(`vacancy=${q.jobId}`)
  if (q.stageId) parts.push(`stage=${q.stageId}`)
  if (q.status) parts.push(`status=${q.status}`)
  if (q.gender) parts.push(`gender=${q.gender}`)
  if (q.province) parts.push(`province=${q.province}`)
  if (q.highestQualification) parts.push(`qualification=${q.highestQualification}`)
  if (isTrue(q.includeAutoRejected)) parts.push('including auto-rejected')
  if (isTrue(q.includeWithdrawn)) parts.push('including withdrawn')
  if (isTrue(q.shortlistedOnly)) parts.push('shortlisted only')
  if (isTrue(q.flaggedOnly)) parts.push('flagged only')
  if (numberOrNull(q.minScore) !== null) parts.push(`score>=${q.minScore}`)
  if (numberOrNull(q.maxScore) !== null) parts.push(`score<=${q.maxScore}`)
  const search = String(q.search ?? '').trim()
  if (search) parts.push(`search="${search}"`)
  return parts.length ? parts.join(', ') : 'no filters'
}

/**
 * An applicant register is personal data leaving the system as a file nobody can
 * revoke. The cap is not a performance limit — it is there so an accidental
 * unfiltered export of the whole register is a decision someone has to make on
 * purpose.
 */
export const EXPORT_ROW_CAP = 5000
