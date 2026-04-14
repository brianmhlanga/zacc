import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createStatisticSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.number().int().min(0, 'Value must be a non-negative integer'),
  prefix: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.enum(['green', 'gold', 'black', 'blue', 'red', 'purple', 'orange']).optional().nullable(),
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  section: z.string().default('homepage'),
  year: z.number().int().min(2000).max(2100).optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create statistics
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create statistics'
      })
    }

    const body = await readBody(event)
    const data = createStatisticSchema.parse(body)

    // Create statistic
    const y = data.year ?? new Date().getFullYear()

    const statistic = await prisma.statistic.create({
      data: {
        label: data.label,
        value: data.value,
        prefix: data.prefix || null,
        suffix: data.suffix || null,
        icon: data.icon || null,
        color: data.color || null,
        order: data.order,
        isVisible: data.isVisible,
        section: data.section,
        year: y
      }
    })

    return statistic
  } catch (error: any) {
    console.error('Error creating statistic:', error)
    
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
      statusMessage: error.message || 'Failed to create statistic'
    })
  }
})

