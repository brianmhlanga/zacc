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

    // Only SUPER_ADMIN and ADMIN can delete news
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can delete news'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'News ID is required'
      })
    }

    // Check if news exists
    const existing = await prisma.news.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'News article not found'
      })
    }

    // Delete news (tags will be cascade deleted)
    await prisma.news.delete({
      where: { id }
    })

    return { success: true, message: 'News article deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete news article'
    })
  }
})

