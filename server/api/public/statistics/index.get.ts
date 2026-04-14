import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const section = query.section as string | undefined
    const yearRaw = query.year as string | undefined
    const defaultYear = new Date().getFullYear()
    const year =
      yearRaw !== undefined && yearRaw !== ''
        ? parseInt(String(yearRaw), 10)
        : defaultYear

    const where: any = {
      isVisible: true
    }

    if (section) {
      where.section = section
    }

    if (!Number.isNaN(year)) {
      where.year = year
    }

    const statistics = await prisma.statistic.findMany({
      where,
      orderBy: [{ section: 'asc' }, { order: 'asc' }]
    })

    return statistics
  } catch (error: any) {
    console.error('[Statistics API] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch statistics'
    })
  }
})

