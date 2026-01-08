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

    // Only SUPER_ADMIN can delete settings
    if (!['SUPER_ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only super administrators can delete settings'
      })
    }

    const key = getRouterParam(event, 'key')
    if (!key) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Setting key is required'
      })
    }

    // Check if setting exists
    const existing = await prisma.siteSetting.findUnique({
      where: { key }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Setting not found'
      })
    }

    // Delete setting
    await prisma.siteSetting.delete({
      where: { key }
    })

    return { success: true, message: 'Setting deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete setting'
    })
  }
})

