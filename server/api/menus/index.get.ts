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

    // Fetch menus with their items
    const menus = await prisma.menu.findMany({
      include: {
        items: {
          where: {
            parentId: null // Only get top-level items
          },
          orderBy: {
            order: 'asc'
          },
          include: {
            children: {
              orderBy: {
                order: 'asc'
              },
              include: {
                children: {
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        location: 'asc'
      }
    })

    return menus
  } catch (error: any) {
    console.error('Error fetching menus:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch menus',
      data: {
        originalError: error.message,
        stack: error.stack
      }
    })
  }
})

