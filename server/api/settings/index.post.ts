import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'json', 'image', 'url']),
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

    // Only ADMIN and SUPER_ADMIN can create settings
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can create settings'
      })
    }

    const body = await readBody(event)
    const data = createSettingSchema.parse(body)

    // Check if key already exists
    const existing = await prisma.siteSetting.findUnique({
      where: { key: data.key }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A setting with this key already exists'
      })
    }

    // Create setting
    const setting = await prisma.siteSetting.create({
      data: {
        key: data.key,
        value: data.value,
        type: data.type,
        category: data.category || null,
        description: data.description || null,
        updatedBy: session.user.id
      }
    })

    return setting
  } catch (error: any) {
    console.error('Error creating setting:', error)
    
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
      statusMessage: error.message || 'Failed to create setting'
    })
  }
})

