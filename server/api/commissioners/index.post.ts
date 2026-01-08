import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createCommissionerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Position type is required'),
  title: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  bio: z.string().optional().nullable(),
  imageUrl: z.string().min(1, 'Image URL is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true)
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create commissioners
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create commissioners'
      })
    }

    const body = await readBody(event)
    const data = createCommissionerSchema.parse(body)

    // Create commissioner
    const commissioner = await prisma.commissioner.create({
      data: {
        name: data.name,
        role: data.role,
        title: data.title || null,
        description: data.description,
        bio: data.bio || null,
        imageUrl: data.imageUrl,
        email: data.email || null,
        phone: data.phone || null,
        order: data.order,
        isActive: data.isActive
      }
    })

    return commissioner
  } catch (error: any) {
    console.error('Error creating commissioner:', error)
    
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
      statusMessage: error.message || 'Failed to create commissioner'
    })
  }
})

