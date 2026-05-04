import { prisma } from '../../../utils/prisma'
import { aggregateKeywordCounts } from '../../../utils/reportKeywordAnalytics'
import { centroidForProvinceSlug } from '../../../utils/zimbabweProvinceCentroids'

const KEYWORD_TEXT_SAMPLE = 800

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  /** Exclude admin list–archived reports from analytics. */
  const ra = { isArchived: false }

  const [
    total,
    anonymousCount,
    identifiedCount,
    withAudio,
    withFiles,
    byStatus,
    byPriority,
    byCorruptionType,
    byProvince,
    recentForTrend
  ] = await Promise.all([
    prisma.corruptionReport.count({ where: ra }),
    prisma.corruptionReport.count({ where: { ...ra, isAnonymous: true } }),
    prisma.corruptionReport.count({ where: { ...ra, isAnonymous: false } }),
    prisma.corruptionReport.count({ where: { ...ra, audioUrl: { not: null } } }),
    prisma.corruptionReport.count({
      where: { ...ra, files: { some: {} } }
    }),
    prisma.corruptionReport.groupBy({
      by: ['status'],
      where: ra,
      _count: { _all: true }
    }),
    prisma.corruptionReport.groupBy({
      by: ['priority'],
      where: ra,
      _count: { _all: true }
    }),
    prisma.corruptionReport.groupBy({
      by: ['corruptionType'],
      where: ra,
      _count: { _all: true }
    }),
    prisma.corruptionReport.groupBy({
      by: ['province'],
      where: ra,
      _count: { _all: true }
    }),
    prisma.corruptionReport.findMany({
      where: { ...ra, createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true }
    })
  ])

  const monthKeys: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const volumeByMonth: Record<string, number> = Object.fromEntries(monthKeys.map((k) => [k, 0]))
  for (const r of recentForTrend) {
    const d = new Date(r.createdAt)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (k in volumeByMonth) volumeByMonth[k]++
  }

  const mapHotspots = byProvince
    .map((row) => {
      const slug = row.province
      const count = row._count._all
      const centroid = centroidForProvinceSlug(slug)
      if (!centroid) {
        return {
          slug: slug || 'unknown',
          label: slug ? `Unknown coordinates (${slug})` : 'Province not specified',
          lat: -19.015438,
          lng: 29.154857,
          count,
          approximate: true as const
        }
      }
      return {
        slug: slug || 'unknown',
        label: centroid.label,
        lat: centroid.lat,
        lng: centroid.lng,
        count,
        approximate: false as const
      }
    })
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)

  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const [newLast30, closedTotal, textRows] = await Promise.all([
    prisma.corruptionReport.count({
      where: { ...ra, createdAt: { gte: last30 } }
    }),
    prisma.corruptionReport.count({
      where: { ...ra, status: { in: ['CLOSED', 'ARCHIVED'] } }
    }),
    prisma.corruptionReport.findMany({
      where: ra,
      orderBy: { createdAt: 'desc' },
      take: KEYWORD_TEXT_SAMPLE,
      select: {
        incidentDescription: true,
        additionalInfo: true,
        peopleInvolved: true,
        location: true
      }
    })
  ])

  const keywordFragments: string[] = []
  for (const row of textRows) {
    keywordFragments.push(row.incidentDescription, row.additionalInfo, row.peopleInvolved, row.location)
  }
  const keywords = aggregateKeywordCounts(keywordFragments, 50)

  return {
    generatedAt: now.toISOString(),
    summary: {
      total,
      anonymousCount,
      identifiedCount,
      anonymousRate: total ? Math.round((anonymousCount / total) * 1000) / 10 : 0,
      withAudio,
      withFiles,
      withAudioRate: total ? Math.round((withAudio / total) * 1000) / 10 : 0,
      withFilesRate: total ? Math.round((withFiles / total) * 1000) / 10 : 0,
      newReportsLast30Days: newLast30,
      closedOrArchivedTotal: closedTotal
    },
    byStatus: byStatus.map((r) => ({ key: r.status, count: r._count._all })),
    byPriority: byPriority.map((r) => ({ key: r.priority, count: r._count._all })),
    byCorruptionType: byCorruptionType
      .map((r) => ({ key: r.corruptionType, count: r._count._all }))
      .sort((a, b) => b.count - a.count),
    byProvince: byProvince
      .map((r) => ({ province: r.province, count: r._count._all }))
      .sort((a, b) => b.count - a.count),
    volumeByMonth: monthKeys.map((key) => ({
      key,
      label: formatMonthLabel(key),
      count: volumeByMonth[key] ?? 0
    })),
    mapHotspots,
    keywords,
    keywordSampleReportCount: textRows.length
  }
})

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1, 1)
  return d.toLocaleString('en-GB', { month: 'short', year: 'numeric' })
}
