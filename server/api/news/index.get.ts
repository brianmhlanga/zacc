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
    const category = query.category as string | undefined
    const isPublished = query.isPublished !== undefined ? query.isPublished === 'true' : undefined

    // Build where clause
    const where: any = {}
    if (category) {
      where.category = category
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished
    }

    // Fetch news articles
    const news = await prisma.news.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        tags: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return news
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch news'
    })
  }
})

