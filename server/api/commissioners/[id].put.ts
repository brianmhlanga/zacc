import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateCommissionerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.string().min(1, 'Position type is required').optional(),
  title: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required').optional(),
  bio: z.string().optional().nullable(),
  imageUrl: z.string().min(1, 'Image URL is required').optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update commissioners
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update commissioners'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Commissioner ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateCommissionerSchema.parse(body)

    // Check if commissioner exists
    const existing = await prisma.commissioner.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Commissioner not found'
      })
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.order !== undefined) updateData.order = data.order
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Update commissioner
    const commissioner = await prisma.commissioner.update({
      where: { id },
      data: updateData
    })

    return commissioner
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
      statusMessage: 'Failed to update commissioner'
    })
  }
})

