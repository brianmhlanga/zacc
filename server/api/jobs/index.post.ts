import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  department: z.enum(['investigations', 'legal', 'compliance', 'administration', 'it', 'finance', 'hr', 'communications']),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().min(1, 'Description is required'),
  keyRequirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  responsibilities: z.array(z.string()).min(1, 'At least one responsibility is required'),
  benefits: z.string().optional().nullable(),
  closingDate: z.string().datetime(),
  isPublished: z.boolean().default(false),
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create jobs
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create jobs'
      })
    }

    const body = await readBody(event)
    const data = createJobSchema.parse(body)

    // Check if slug already exists
    const existing = await prisma.job.findUnique({
      where: { slug: data.slug }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A job with this slug already exists'
      })
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title: data.title,
        slug: data.slug,
        department: data.department,
        location: data.location,
        type: data.type,
        summary: data.summary,
        description: data.description,
        keyRequirements: data.keyRequirements,
        responsibilities: data.responsibilities,
        benefits: data.benefits || null,
        closingDate: new Date(data.closingDate),
        isPublished: data.isPublished,
        isActive: data.isActive,
        publishedAt: data.isPublished ? new Date() : null,
        createdBy: session.user.id,
        updatedBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return job
  } catch (error: any) {
    console.error('Error creating job:', error)
    
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
      statusMessage: error.message || 'Failed to create job'
    })
  }
})

