import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

const bulkUpdateSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    order: z.number().int(),
    parentId: z.string().nullable().optional()
  }))
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

    const body = await readBody(event)
    const data = bulkUpdateSchema.parse(body)

    // Update all menu items in a transaction
    const updates = await Promise.all(
      data.items.map(async (item) => {
        return prisma.menuItem.update({
          where: { id: item.id },
          data: {
            order: item.order,
            parentId: item.parentId || null
          }
        })
      })
    )

    return { success: true, updated: updates.length, items: updates }
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
      statusMessage: 'Failed to update menu items'
    })
  }
})

