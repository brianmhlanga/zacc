import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string | undefined
    const limit = query.limit ? parseInt(query.limit as string) : undefined

    // Build where clause - only published news
    const where: any = {
      isPublished: true
    }
    
    if (category) {
      where.category = category
    }

    // Fetch news articles
    const news = await prisma.news.findMany({
      where,
      include: {
        tags: true
      },
      orderBy: [
        { isFeatured: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
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

