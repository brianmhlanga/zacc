import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const section = (query.section as string) || 'statistics'

    const rows = await prisma.statistic.findMany({
      where: {
        section,
        isVisible: true
      },
      select: { year: true }
    })

    const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a)
    const fallback = new Date().getFullYear()

    return {
      years: years.length > 0 ? years : [fallback]
    }
  } catch (error: any) {
    console.error('[statistics years]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load years'
    })
  }
})
