import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../../utils/prisma'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER']).optional(),
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

    // Only SUPER_ADMIN and ADMIN can update users
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can update users'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // If email is being changed, check if new email is already taken
    if (data.email && data.email.toLowerCase() !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      })

      if (emailTaken) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email is already taken by another user'
        })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email.toLowerCase()
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
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
      statusMessage: 'Failed to update user'
    })
  }
})

