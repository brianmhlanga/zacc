import { prisma } from '../../../utils/prisma'
import { buildApplicationWhere } from '../../../utils/applicationFilters'

/**
 * The shortlisting console feed.
 *
 * Server-paginated — the first list endpoint in this codebase that is. Every
 * other one findMany's the whole table and paginates in the browser, which is
 * survivable for 40 news articles and not for an applicant register that runs to
 * thousands of rows with thirty columns each.
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

    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(100, Math.max(5, Number(q.pageSize) || 25))
    const sortField = SORTABLE.has(String(q.sortField)) ? String(q.sortField) : 'finalScore'
    const sortOrder = String(q.sortOrder) === 'asc' ? 'asc' : 'desc'

    const where = buildApplicationWhere(q)

    const [total, rows, stages, aggregates] = await Promise.all([
      prisma.jobApplication.count({ where }),
      prisma.jobApplication.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        // Nulls sort last on MySQL for desc, which is what we want: unscored
        // applications should not sit at the top of a score-ranked list.
        orderBy: [{ [sortField]: sortOrder }, { createdAt: 'desc' }],
        select: {
          id: true, referenceNumber: true, name: true, firstName: true, lastName: true,
          email: true, phone: true, gender: true, province: true,
          highestQualification: true, totalYearsExperience: true,
          finalScore: true, autoScore: true, panelScoreMean: true, panelScoreSpread: true,
          panelReviewCount: true, keywordMatchPct: true, integrityFlagCount: true,
          isAutoRejected: true, isShortlisted: true, isWithdrawn: true,
        wasTestModeAtSubmit: true,
          status: true, notes: true, submittedAt: true, createdAt: true, mode: true,
          job: { select: { id: true, title: true, department: true, panelSpreadThreshold: true } },
          stage: { select: { id: true, key: true, internalLabel: true, publicLabel: true, colorHex: true, isRejection: true } },
          _count: { select: { documents: true, flags: true } }
        }
      }),
      prisma.recruitmentStage.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, key: true, internalLabel: true, publicLabel: true, colorHex: true, isRejection: true }
      }),
      // Tiles reflect the current filter, not the whole table, or they would
      // contradict the rows on screen.
      prisma.jobApplication.aggregate({
        where,
        _avg: { finalScore: true },
        _count: { _all: true }
      })
    ])

    const [shortlisted, flagged, women] = await Promise.all([
      prisma.jobApplication.count({ where: { ...where, isShortlisted: true } }),
      prisma.jobApplication.count({ where: { ...where, integrityFlagCount: { gt: 0 } } }),
      prisma.jobApplication.count({ where: { ...where, gender: 'Female' } })
    ])

    const counted = aggregates._count._all || 0

    return {
      rows: rows.map((r: any) => ({
        ...r,
        // Surfaced so the console can mark panels that disagree rather than
        // presenting an average that hides a 4-to-13 split.
        panelDisagreement:
          r.panelScoreSpread != null &&
          r.job?.panelSpreadThreshold != null &&
          r.panelScoreSpread > r.job.panelSpreadThreshold
      })),
      page,
      pageSize,
      total,
      stages,
      summary: {
        total,
        shortlisted,
        flagged,
        averageScore: aggregates._avg.finalScore != null ? Math.round(aggregates._avg.finalScore * 10) / 10 : null,
        femalePct: counted ? Math.round((women / counted) * 1000) / 10 : null
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/applications] list failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load applications' })
  }
})
