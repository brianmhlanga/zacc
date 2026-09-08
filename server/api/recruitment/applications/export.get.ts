import { prisma } from '../../../utils/prisma'
import { toCsv, csvFilename } from '../../../utils/csv'
import {
  buildApplicationWhere,
  describeApplicationFilter,
  EXPORT_ROW_CAP
} from '../../../utils/applicationFilters'
import { qualificationLabel } from '../../../../shared/recruitment/qualifications'

/**
 * CSV of the shortlisting console, filtered exactly as the screen is.
 *
 * It takes the same query string the list endpoint takes and runs it through the
 * same `buildApplicationWhere`, so "the CSV matches what I am looking at" holds
 * without anyone maintaining two copies of the filter.
 *
 * Every export is audited. This file is an applicant register — names, contact
 * details, scores and integrity flags — leaving the system in a form nobody can
 * recall, so who took what, when, and under which filter is worth a row.
 */
const SORTABLE = new Set([
  'finalScore', 'submittedAt', 'createdAt', 'keywordMatchPct',
  'totalYearsExperience', 'lastName'
])

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const q = getQuery(event)
    const where = buildApplicationWhere(q)
    const sortField = SORTABLE.has(String(q.sortField)) ? String(q.sortField) : 'finalScore'
    const sortOrder = String(q.sortOrder) === 'asc' ? 'asc' : 'desc'

    const total = await prisma.jobApplication.count({ where })
    if (total > EXPORT_ROW_CAP) {
      throw createError({
        statusCode: 413,
        statusMessage:
          `This export would contain ${total.toLocaleString()} applicants, over the ` +
          `${EXPORT_ROW_CAP.toLocaleString()} limit. Narrow the filters — by vacancy or ` +
          `stage — and export again.`
      })
    }

    const rows = await prisma.jobApplication.findMany({
      where,
      take: EXPORT_ROW_CAP,
      orderBy: [{ [sortField]: sortOrder }, { createdAt: 'desc' }],
      select: {
        referenceNumber: true, firstName: true, lastName: true, name: true,
        email: true, phone: true, gender: true, province: true,
        highestQualification: true, totalYearsExperience: true,
        finalScore: true, autoScore: true, panelScoreMean: true, panelScoreSpread: true,
        panelReviewCount: true, keywordMatchPct: true, integrityFlagCount: true,
        isAutoRejected: true, isShortlisted: true, isWithdrawn: true,
        howHeard: true, submittedAt: true, createdAt: true,
        job: { select: { title: true, department: true } },
        stage: { select: { internalLabel: true, publicLabel: true } }
      }
    })

    const round = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10)
    const yesNo = (b: boolean | null) => (b ? 'Yes' : 'No')
    const date = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null)

    const columns = [
      { header: 'Reference', value: (r: any) => r.referenceNumber },
      { header: 'Vacancy', value: (r: any) => r.job?.title },
      { header: 'Department', value: (r: any) => r.job?.department },
      { header: 'Name', value: (r: any) => [r.firstName, r.lastName].filter(Boolean).join(' ') || r.name },
      { header: 'Email', value: (r: any) => r.email },
      { header: 'Phone', value: (r: any) => r.phone },
      { header: 'Gender', value: (r: any) => r.gender },
      { header: 'Province', value: (r: any) => r.province },
      { header: 'Highest qualification', value: (r: any) => r.highestQualification ? qualificationLabel(r.highestQualification) : null },
      { header: 'Years of experience', value: (r: any) => r.totalYearsExperience },
      // Both scores, because a final score that differs from the automatic one
      // is the panel's doing and a reviewer will want to see that in the file.
      { header: 'Final score', value: (r: any) => round(r.finalScore) },
      { header: 'Automatic score', value: (r: any) => round(r.autoScore) },
      { header: 'Panel mean', value: (r: any) => round(r.panelScoreMean) },
      { header: 'Panel spread', value: (r: any) => round(r.panelScoreSpread) },
      { header: 'Panel reviews', value: (r: any) => r.panelReviewCount },
      { header: 'Keyword match %', value: (r: any) => round(r.keywordMatchPct) },
      { header: 'Integrity flags', value: (r: any) => r.integrityFlagCount },
      // The internal stage, not the public one: this file is for HR.
      { header: 'Stage (internal)', value: (r: any) => r.stage?.internalLabel },
      { header: 'Stage (candidate sees)', value: (r: any) => r.stage?.publicLabel },
      { header: 'Shortlisted', value: (r: any) => yesNo(r.isShortlisted) },
      { header: 'Auto-rejected', value: (r: any) => yesNo(r.isAutoRejected) },
      { header: 'Withdrawn', value: (r: any) => yesNo(r.isWithdrawn) },
      { header: 'Heard via', value: (r: any) => r.howHeard },
      { header: 'Submitted', value: (r: any) => date(r.submittedAt) }
    ]

    await prisma.recruitmentAuditLog.create({
      data: {
        action: 'application.register_exported',
        entityType: 'JobApplication',
        jobId: q.jobId ? String(q.jobId) : null,
        actorId: (session.user as any).id ?? null,
        actorName: (session.user as any).name ?? (session.user as any).email ?? null,
        actorRole: (session.user as any).role ?? null,
        summary: `Exported ${rows.length} applicant record(s) — ${describeApplicationFilter(q)}`,
        detail: { rowCount: rows.length, filters: q, sortField, sortOrder } as any,
        ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null
      }
    })

    const filename = csvFilename(`zacc-applicants-${new Date().toISOString().slice(0, 10)}`)
    setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
    setResponseHeader(event, 'content-disposition', `attachment; filename="${filename}"`)
    return toCsv(rows, columns)
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/applications] export failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to export applications' })
  }
})
