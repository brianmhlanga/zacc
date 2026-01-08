import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

const createMenuItemSchema = z.object({
  menuId: z.string().min(1, 'Menu ID is required'),
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['custom', 'page', 'category', 'post', 'url']),
  url: z.string().optional().nullable(),
  target: z.enum(['_self', '_blank']).default('_self'),
  icon: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  parentId: z.string().optional().nullable(),
  pageId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable()
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

    // Only ADMIN and SUPER_ADMIN can create menu items
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create menu items'
      })
    }

    const body = await readBody(event)
    const data = createMenuItemSchema.parse(body)

    // Check if menu exists
    const menu = await prisma.menu.findUnique({
      where: { id: data.menuId }
    })

    if (!menu) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Menu not found'
      })
    }

    // Check if parent exists (if provided)
    if (data.parentId) {
      const parent = await prisma.menuItem.findUnique({
        where: { id: data.parentId }
      })

      if (!parent) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Parent menu item not found'
        })
      }
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        menuId: data.menuId,
        label: data.label,
        type: data.type,
        url: data.url || null,
        target: data.target,
        icon: data.icon || null,
        order: data.order,
        isVisible: data.isVisible,
        parentId: data.parentId || null,
        pageId: data.pageId || null,
        categoryId: data.categoryId || null
      }
    })

    setResponseStatus(event, 201)
    return menuItem
  } catch (error: any) {
    console.error('Error creating menu item:', error)
    
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
      statusMessage: error.message || 'Failed to create menu item'
    })
  }
})

