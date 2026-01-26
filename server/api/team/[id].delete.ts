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

    // Only ADMIN and SUPER_ADMIN can delete executives
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can delete executives'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID is required'
      })
    }

    // Check if team member exists
    const existing = await prisma.team.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Executive not found'
      })
    }

    // Delete team member
    await prisma.team.delete({
      where: { id }
    })

    return { success: true, message: 'Executive deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete executive'
    })
  }
})
