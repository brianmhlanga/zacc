import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../../utils/prisma'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER']),
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

    // Only SUPER_ADMIN and ADMIN can create users
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can create users'
      })
    }

    const body = await readBody(event)
    const data = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    })

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User with this email already exists'
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        isActive: data.isActive
      },
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
      statusMessage: 'Failed to create user'
    })
  }
})

