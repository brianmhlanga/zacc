import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const bulkUpdateSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string()
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

    // Only ADMIN and SUPER_ADMIN can update settings
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can update settings'
      })
    }

    const body = await readBody(event)
    const data = bulkUpdateSchema.parse(body)

    // Update all settings in a transaction
    const updates = await Promise.all(
      data.settings.map(async (setting) => {
        return prisma.siteSetting.update({
          where: { key: setting.key },
          data: {
            value: setting.value,
            updatedBy: session.user.id
          }
        })
      })
    )

    return { success: true, updated: updates.length, settings: updates }
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
      statusMessage: 'Failed to update settings'
    })
  }
})

