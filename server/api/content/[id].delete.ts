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

    // Only SUPER_ADMIN and ADMIN can delete content
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can delete content'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content ID is required'
      })
    }

    // Check if content exists
    const existing = await prisma.pageContent.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found'
      })
    }

    // Delete content
    await prisma.pageContent.delete({
      where: { id }
    })

    return { success: true, message: 'Content deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete content'
    })
  }
})

