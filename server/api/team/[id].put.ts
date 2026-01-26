import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update executives
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update executives'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateTeamSchema.parse(body)

    // Check if team member exists
    const existing = await prisma.team.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Executive not found'
      })
    }

    // Update team member
    const teamMember = await prisma.team.update({
      where: { id },
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

    return teamMember
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: {
          errors: error.errors
        }
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update executive'
    })
  }
})
