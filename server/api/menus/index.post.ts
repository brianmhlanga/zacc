import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createMenuSchema = z.object({
  name: z.string().min(1, 'Menu name is required'),
  location: z.string().min(1, 'Menu location is required'),
  description: z.string().optional().nullable()
})

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

    // Only ADMIN and SUPER_ADMIN can create menus
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can create menus'
      })
    }

    const body = await readBody(event)
    const data = createMenuSchema.parse(body)

    // Check if menu with same name or location exists
    const existing = await prisma.menu.findFirst({
      where: {
        OR: [
          { name: data.name },
          { location: data.location }
        ]
      }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A menu with this name or location already exists'
      })
    }

    // Create menu
    const menu = await prisma.menu.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description || null
      },
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
      }
    })

    setResponseStatus(event, 201)
    return menu
  } catch (error: any) {
    console.error('Error creating menu:', error)
    
    if (error.statusCode) {
      throw error
    }

    // Handle validation errors
    if (error.issues) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || 'Validation error'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create menu'
    })
  }
})

