import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateContentSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required').optional(),
  imageUrl: z.string().optional(),
  order: z.number().int().optional(),
  isVisible: z.boolean().optional(),
  metadata: z.any().optional(),
  isLocked: z.boolean().optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update content
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update content'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateContentSchema.parse(body)

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

    if (existing.isLocked && session.user.role !== 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'This content section is locked. Only a super administrator can change it.'
      })
    }

    if (data.isLocked !== undefined && session.user.role !== 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only a super administrator can change the lock setting.'
      })
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: session.user.id
    }
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.order !== undefined) updateData.order = data.order
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible
    if (data.metadata !== undefined) updateData.metadata = data.metadata
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked

    // Update content
    const content = await prisma.pageContent.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return content
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
      statusMessage: 'Failed to update content'
    })
  }
})

