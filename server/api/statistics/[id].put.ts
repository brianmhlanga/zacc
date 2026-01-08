import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateStatisticSchema = z.object({
  label: z.string().min(1, 'Label is required').optional(),
  value: z.number().int().min(0, 'Value must be a non-negative integer').optional(),
  prefix: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.enum(['green', 'gold', 'black', 'blue', 'red', 'purple', 'orange']).optional().nullable(),
  order: z.number().int().optional(),
  isVisible: z.boolean().optional(),
  section: z.string().optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update statistics
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update statistics'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Statistic ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateStatisticSchema.parse(body)

    // Check if statistic exists
    const existing = await prisma.statistic.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Statistic not found'
      })
    }

    // Prepare update data
    const updateData: any = {}
    if (data.label !== undefined) updateData.label = data.label
    if (data.value !== undefined) updateData.value = data.value
    if (data.prefix !== undefined) updateData.prefix = data.prefix
    if (data.suffix !== undefined) updateData.suffix = data.suffix
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.color !== undefined) updateData.color = data.color
    if (data.order !== undefined) updateData.order = data.order
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible
    if (data.section !== undefined) updateData.section = data.section

    // Update statistic
    const statistic = await prisma.statistic.update({
      where: { id },
      data: updateData
    })

    return statistic
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
      statusMessage: 'Failed to update statistic'
    })
  }
})

