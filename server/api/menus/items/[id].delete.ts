import { prisma } from '../../../utils/prisma'

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

    // Only ADMIN and SUPER_ADMIN can delete menu items
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can delete menu items'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Menu item ID is required'
      })
    }

    // Check if menu item exists
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        children: true
      }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Menu item not found'
      })
    }

    // Delete menu item (children will be cascade deleted)
    await prisma.menuItem.delete({
      where: { id }
    })

    setHeader(event, 'Content-Type', 'application/json')
    return { success: true, message: 'Menu item deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete menu item'
    })
  }
})

