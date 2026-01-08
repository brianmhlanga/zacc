import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateSettingSchema = z.object({
  value: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'json', 'image', 'url']).optional(),
  category: z.string().optional().nullable(),
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

    // Only ADMIN and SUPER_ADMIN can update settings
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can update settings'
      })
    }

    const key = getRouterParam(event, 'key')
    if (!key) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Setting key is required'
      })
    }

    const body = await readBody(event)
    const data = updateSettingSchema.parse(body)

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

    // Prepare update data
    const updateData: any = {
      value: data.value,
      updatedBy: session.user.id
    }
    if (data.type !== undefined) updateData.type = data.type
    if (data.category !== undefined) updateData.category = data.category
    if (data.description !== undefined) updateData.description = data.description

    // Update setting
    const setting = await prisma.siteSetting.update({
      where: { key },
      data: updateData
    })

    return setting
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
      statusMessage: 'Failed to update setting'
    })
  }
})

