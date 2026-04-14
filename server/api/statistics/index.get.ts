import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event)
    const section = query.section as string | undefined
    const isVisible = query.isVisible !== undefined ? query.isVisible === 'true' : undefined
    const yearRaw = query.year as string | undefined
    const year =
      yearRaw !== undefined && yearRaw !== ''
        ? parseInt(String(yearRaw), 10)
        : undefined

    // Build where clause
    const where: any = {}
    if (section) {
      where.section = section
    }
    if (isVisible !== undefined) {
      where.isVisible = isVisible
    }
    if (year !== undefined && !Number.isNaN(year)) {
      where.year = year
    }

    // Fetch statistics
    const statistics = await prisma.statistic.findMany({
      where,
      orderBy: [
        { section: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return statistics
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch statistics'
    })
  }
})

