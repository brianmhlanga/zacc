import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

const updateMenuItemSchema = z.object({
  label: z.string().min(1, 'Label is required').optional(),
  type: z.enum(['custom', 'page', 'category', 'post', 'url']).optional(),
  url: z.string().optional().nullable(),
  target: z.enum(['_self', '_blank']).optional(),
  icon: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isVisible: z.boolean().optional(),
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

    // Only ADMIN and SUPER_ADMIN can update menu items
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update menu items'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Menu item ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateMenuItemSchema.parse(body)

    // Check if menu item exists
    const existing = await prisma.menuItem.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Menu item not found'
      })
    }

    // Prevent circular references
    if (data.parentId === id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A menu item cannot be its own parent'
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

      // Ensure parent is in the same menu
      if (parent.menuId !== existing.menuId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Parent menu item must be in the same menu'
        })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.label !== undefined) updateData.label = data.label
    if (data.type !== undefined) updateData.type = data.type
    if (data.url !== undefined) updateData.url = data.url
    if (data.target !== undefined) updateData.target = data.target
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.order !== undefined) updateData.order = data.order
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible
    if (data.parentId !== undefined) updateData.parentId = data.parentId
    if (data.pageId !== undefined) updateData.pageId = data.pageId
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId

    // Update menu item
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData
    })

    return menuItem
  } catch (error: any) {
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
      statusMessage: 'Failed to update menu item'
    })
  }
})

