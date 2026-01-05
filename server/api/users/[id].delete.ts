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

    // Only SUPER_ADMIN can delete users
    if (session.user.role !== 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only super administrators can delete users'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Prevent deleting yourself
    if (id === session.user.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You cannot delete your own account'
      })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return { success: true, message: 'User deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete user'
    })
  }
})

