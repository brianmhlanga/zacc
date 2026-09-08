import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { toCsv, csvFilename } from '../../../utils/csv'
import { qualificationLabel } from '../../../../shared/recruitment/qualifications'

/**
 * Runs a recruitment report and returns rows as JSON or CSV.
 *
 * Aggregations follow the shape already used by the corruption-report analytics
 * endpoint: a Promise.all of counts and groupBys, with time series pre-seeded in
 * JS so months with no applications render as 0 rather than vanishing from the
 * chart.
 */
const querySchema = z.object({
  type: z.enum([
    'APPLICANT_REGISTER',
    'APPLICATION_PIPELINE',
    'VACANCY_PERFORMANCE',
    'CANDIDATE_DEMOGRAPHICS',
    'SCORE_DISTRIBUTION',
    'QUALIFICATION_PROFILE',
    'KEYWORD_COVERAGE',
    'INTEGRITY_FLAGS',
    'SOURCE_OF_APPLICATION'
  ]),
  jobIds: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  includeAutoRejected: z.boolean().optional(),
  includeWithdrawn: z.boolean().optional(),
  format: z.enum(['json', 'csv']).default('json')
})

/** Percentage to one decimal, matching the existing analytics endpoint. */
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0)

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const q = querySchema.parse(await readBody(event))

    const where: any = {}
    if (q.jobIds?.length) where.jobId = { in: q.jobIds }
    if (!q.includeAutoRejected) where.isAutoRejected = false
    if (!q.includeWithdrawn) where.isWithdrawn = false
    if (q.dateFrom || q.dateTo) {
      where.createdAt = {}
      if (q.dateFrom) where.createdAt.gte = new Date(q.dateFrom)
      if (q.dateTo) where.createdAt.lte = new Date(`${q.dateTo}T23:59:59.999Z`)
    }

    let columns: Array<{ header: string; value: (r: any) => unknown }> = []
    let rows: any[] = []
    let title = ''

    switch (q.type) {
      case 'APPLICANT_REGISTER': {
        title = 'Applicant register'
        const data = await prisma.jobApplication.findMany({
          where,
          orderBy: [{ jobId: 'asc' }, { finalScore: 'desc' }],
          select: {
            referenceNumber: true, firstName: true, lastName: true, name: true, email: true,
            phone: true, gender: true, province: true, highestQualification: true,
            totalYearsExperience: true, finalScore: true, keywordMatchPct: true,
            integrityFlagCount: true, isAutoRejected: true, isShortlisted: true,
            howHeard: true, submittedAt: true,
            job: { select: { title: true, department: true } },
            stage: { select: { internalLabel: true } }
          }
        })
        rows = data
        columns = [
          { header: 'Reference', value: (r) => r.referenceNumber },
          { header: 'Vacancy', value: (r) => r.job?.title },
          { header: 'Department', value: (r) => r.job?.department },
          { header: 'Name', value: (r) => [r.firstName, r.lastName].filter(Boolean).join(' ') || r.name },
          { header: 'Email', value: (r) => r.email },
          { header: 'Phone', value: (r) => r.phone },
          { header: 'Gender', value: (r) => r.gender },
          { header: 'Province', value: (r) => r.province },
          { header: 'Highest qualification', value: (r) => r.highestQualification ? qualificationLabel(r.highestQualification) : '' },
          { header: 'Years experience', value: (r) => r.totalYearsExperience },
          { header: 'Score', value: (r) => r.finalScore },
          { header: 'Keyword match %', value: (r) => r.keywordMatchPct },
          { header: 'Integrity flags', value: (r) => r.integrityFlagCount },
          { header: 'Stage', value: (r) => r.stage?.internalLabel },
          { header: 'Shortlisted', value: (r) => r.isShortlisted },
          { header: 'Auto-rejected', value: (r) => r.isAutoRejected },
          { header: 'Heard via', value: (r) => r.howHeard },
          { header: 'Submitted', value: (r) => r.submittedAt }
        ]
        break
      }

      case 'APPLICATION_PIPELINE': {
        title = 'Pipeline by stage'
        const [grouped, stages, total] = await Promise.all([
          prisma.jobApplication.groupBy({ by: ['stageId'], where, _count: { _all: true }, _avg: { finalScore: true } }),
          prisma.recruitmentStage.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, internalLabel: true, publicLabel: true } }),
          prisma.jobApplication.count({ where })
        ])
        const byId = new Map(grouped.map((g: any) => [g.stageId, g]))
        // Every stage is listed, including empty ones — a funnel with gaps
        // missing is a misleading funnel.
        rows = stages.map((s: any) => {
          const g: any = byId.get(s.id)
          return {
            stage: s.internalLabel,
            candidateSees: s.publicLabel,
            count: g?._count._all ?? 0,
            share: pct(g?._count._all ?? 0, total),
            averageScore: g?._avg.finalScore != null ? Math.round(g._avg.finalScore * 10) / 10 : null
          }
        })
        columns = [
          { header: 'Stage (internal)', value: (r) => r.stage },
          { header: 'Candidate sees', value: (r) => r.candidateSees },
          { header: 'Applications', value: (r) => r.count },
          { header: 'Share %', value: (r) => r.share },
          { header: 'Average score', value: (r) => r.averageScore }
        ]
        break
      }

      case 'VACANCY_PERFORMANCE': {
        title = 'Vacancy performance'
        const jobs = await prisma.job.findMany({
          where: q.jobIds?.length ? { id: { in: q.jobIds } } : {},
          select: {
            id: true, title: true, department: true, numberOfPosts: true,
            closingDate: true, publishedAt: true, createdAt: true,
            _count: { select: { applications: true } }
          }
        })
        const stats = await prisma.jobApplication.groupBy({
          by: ['jobId'], where, _count: { _all: true }, _avg: { finalScore: true }
        })
        const rejected = await prisma.jobApplication.groupBy({
          by: ['jobId'], where: { ...where, isAutoRejected: true }, _count: { _all: true }
        })
        const shortlisted = await prisma.jobApplication.groupBy({
          by: ['jobId'], where: { ...where, isShortlisted: true }, _count: { _all: true }
        })
        const statById = new Map(stats.map((s: any) => [s.jobId, s]))
        const rejById = new Map(rejected.map((s: any) => [s.jobId, s._count._all]))
        const shortById = new Map(shortlisted.map((s: any) => [s.jobId, s._count._all]))

        rows = jobs.map((j: any) => {
          const s: any = statById.get(j.id)
          const count = s?._count._all ?? 0
          const daysOpen = j.publishedAt
            ? Math.max(1, Math.round((new Date(j.closingDate).getTime() - new Date(j.publishedAt).getTime()) / 86400000))
            : null
          return {
            vacancy: j.title,
            department: j.department,
            posts: j.numberOfPosts,
            applications: count,
            shortlisted: shortById.get(j.id) ?? 0,
            autoRejected: rejById.get(j.id) ?? 0,
            averageScore: s?._avg.finalScore != null ? Math.round(s._avg.finalScore * 10) / 10 : null,
            daysOpen,
            perDay: daysOpen ? Math.round((count / daysOpen) * 10) / 10 : null
          }
        })
        columns = [
          { header: 'Vacancy', value: (r) => r.vacancy },
          { header: 'Department', value: (r) => r.department },
          { header: 'Posts', value: (r) => r.posts },
          { header: 'Applications', value: (r) => r.applications },
          { header: 'Shortlisted', value: (r) => r.shortlisted },
          { header: 'Auto-rejected', value: (r) => r.autoRejected },
          { header: 'Average score', value: (r) => r.averageScore },
          { header: 'Days open', value: (r) => r.daysOpen },
          { header: 'Applications/day', value: (r) => r.perDay }
        ]
        break
      }

      case 'CANDIDATE_DEMOGRAPHICS': {
        title = 'Demographics'
        const total = await prisma.jobApplication.count({ where })
        const [byGender, byProvince] = await Promise.all([
          prisma.jobApplication.groupBy({ by: ['gender'], where, _count: { _all: true }, _avg: { finalScore: true } }),
          prisma.jobApplication.groupBy({ by: ['province'], where, _count: { _all: true } })
        ])
        // Shortlist rate per group is the disparate-impact view — the number
        // worth looking at, not the raw headcount.
        const shortlistedByGender = await prisma.jobApplication.groupBy({
          by: ['gender'], where: { ...where, isShortlisted: true }, _count: { _all: true }
        })
        const shortByGender = new Map(shortlistedByGender.map((g: any) => [g.gender, g._count._all]))

        rows = [
          ...byGender.map((g: any) => ({
            dimension: 'Gender',
            value: g.gender ?? 'Not stated',
            count: g._count._all,
            share: pct(g._count._all, total),
            averageScore: g._avg.finalScore != null ? Math.round(g._avg.finalScore * 10) / 10 : null,
            shortlistRate: pct(shortByGender.get(g.gender) ?? 0, g._count._all)
          })),
          ...byProvince.map((g: any) => ({
            dimension: 'Province',
            value: g.province ?? 'Not stated',
            count: g._count._all,
            share: pct(g._count._all, total),
            averageScore: null,
            shortlistRate: null
          }))
        ]
        columns = [
          { header: 'Dimension', value: (r) => r.dimension },
          { header: 'Value', value: (r) => r.value },
          { header: 'Applicants', value: (r) => r.count },
          { header: 'Share %', value: (r) => r.share },
          { header: 'Average score', value: (r) => r.averageScore },
          { header: 'Shortlist rate %', value: (r) => r.shortlistRate }
        ]
        break
      }

      case 'SCORE_DISTRIBUTION': {
        title = 'Score distribution'
        const scored = await prisma.jobApplication.findMany({
          where: { ...where, finalScore: { not: null } },
          select: { finalScore: true }
        })
        const buckets = Array.from({ length: 10 }, (_, i) => ({
          band: `${i * 10}-${i * 10 + 9}`,
          count: 0
        }))
        for (const s of scored) {
          const idx = Math.min(9, Math.floor((s.finalScore ?? 0) / 10))
          buckets[idx]!.count++
        }
        rows = buckets.map((b) => ({ ...b, share: pct(b.count, scored.length) }))
        columns = [
          { header: 'Score band', value: (r) => r.band },
          { header: 'Applicants', value: (r) => r.count },
          { header: 'Share %', value: (r) => r.share }
        ]
        break
      }

      case 'QUALIFICATION_PROFILE': {
        title = 'Qualification profile'
        const total = await prisma.jobApplication.count({ where })
        const grouped = await prisma.jobApplication.groupBy({
          by: ['highestQualification'], where, _count: { _all: true }, _avg: { finalScore: true }
        })
        rows = grouped.map((g: any) => ({
          qualification: g.highestQualification ? qualificationLabel(g.highestQualification) : 'Not stated',
          count: g._count._all,
          share: pct(g._count._all, total),
          averageScore: g._avg.finalScore != null ? Math.round(g._avg.finalScore * 10) / 10 : null
        })).sort((a: any, b: any) => b.count - a.count)
        columns = [
          { header: 'Highest qualification', value: (r) => r.qualification },
          { header: 'Applicants', value: (r) => r.count },
          { header: 'Share %', value: (r) => r.share },
          { header: 'Average score', value: (r) => r.averageScore }
        ]
        break
      }

      case 'KEYWORD_COVERAGE': {
        title = 'Keyword coverage'
        const hits = await prisma.applicationKeywordHit.groupBy({
          by: ['keyword', 'matched', 'isRequired'],
          where: { application: where },
          _count: { _all: true }
        })
        const agg = new Map<string, { keyword: string; required: boolean; matched: number; total: number }>()
        for (const h of hits) {
          const e = agg.get(h.keyword) ?? { keyword: h.keyword, required: h.isRequired, matched: 0, total: 0 }
          e.total += h._count._all
          if (h.matched) e.matched += h._count._all
          e.required = e.required || h.isRequired
          agg.set(h.keyword, e)
        }
        rows = [...agg.values()]
          .map((e) => ({ ...e, rate: pct(e.matched, e.total) }))
          .sort((a, b) => a.rate - b.rate) // most-missed first: the actionable end
        columns = [
          { header: 'Keyword', value: (r) => r.keyword },
          { header: 'Required', value: (r) => r.required },
          { header: 'Matched', value: (r) => r.matched },
          { header: 'Applicants checked', value: (r) => r.total },
          { header: 'Match rate %', value: (r) => r.rate }
        ]
        break
      }

      case 'INTEGRITY_FLAGS': {
        title = 'Integrity flags'
        const grouped = await prisma.applicationFlag.groupBy({
          by: ['code', 'severity', 'status'],
          where: { application: where },
          _count: { _all: true }
        })
        rows = grouped.map((g: any) => ({
          code: g.code, severity: g.severity, status: g.status, count: g._count._all
        })).sort((a: any, b: any) => b.count - a.count)
        columns = [
          { header: 'Flag', value: (r) => r.code },
          { header: 'Severity', value: (r) => r.severity },
          { header: 'Status', value: (r) => r.status },
          { header: 'Count', value: (r) => r.count }
        ]
        break
      }

      case 'SOURCE_OF_APPLICATION': {
        title = 'Source of application'
        const total = await prisma.jobApplication.count({ where })
        const grouped = await prisma.jobApplication.groupBy({
          by: ['howHeard'], where, _count: { _all: true }, _avg: { finalScore: true }
        })
        const shortlisted = await prisma.jobApplication.groupBy({
          by: ['howHeard'], where: { ...where, isShortlisted: true }, _count: { _all: true }
        })
        const shortBy = new Map(shortlisted.map((g: any) => [g.howHeard, g._count._all]))
        rows = grouped.map((g: any) => ({
          source: g.howHeard ?? 'Not stated',
          count: g._count._all,
          share: pct(g._count._all, total),
          averageScore: g._avg.finalScore != null ? Math.round(g._avg.finalScore * 10) / 10 : null,
          shortlistRate: pct(shortBy.get(g.howHeard) ?? 0, g._count._all)
        })).sort((a: any, b: any) => b.count - a.count)
        columns = [
          { header: 'Source', value: (r) => r.source },
          { header: 'Applicants', value: (r) => r.count },
          { header: 'Share %', value: (r) => r.share },
          { header: 'Average score', value: (r) => r.averageScore },
          { header: 'Shortlist rate %', value: (r) => r.shortlistRate }
        ]
        break
      }
    }

    if (q.format === 'csv') {
      const filename = csvFilename(`zacc-${q.type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}`)
      setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
      setResponseHeader(event, 'content-disposition', `attachment; filename="${filename}"`)
      return toCsv(rows, columns)
    }

    return {
      type: q.type,
      title,
      generatedAt: new Date().toISOString(),
      columns: columns.map((c) => c.header),
      rows: rows.map((r) => Object.fromEntries(columns.map((c) => [c.header, c.value(r)]))),
      rowCount: rows.length
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[recruitment/reports] run failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to run report' })
  }
})
