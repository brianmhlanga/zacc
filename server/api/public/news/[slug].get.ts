import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slug is required'
      })
    }

    const query = getQuery(event)
    const preview = query.preview === 'true'

    // Build where clause
    const where: any = { slug }

    // If not preview mode, only return published articles
    if (!preview) {
      where.isPublished = true
    }

    // Fetch news article
    const article = await prisma.news.findFirst({
      where,
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

    if (!article) {
      throw createError({
        statusCode: 404,
        statusMessage: 'News article not found'
      })
    }

    // Increment views if published (not in preview mode)
    if (!preview && article.isPublished) {
      await prisma.news.update({
        where: { id: article.id },
        data: {
          views: {
            increment: 1
          }
        }
      })
      // Update the views count in the returned object
      article.views = (article.views || 0) + 1
    }

    return article
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch news article'
    })
  }
})

