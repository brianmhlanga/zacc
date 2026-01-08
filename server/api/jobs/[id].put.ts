import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  department: z.enum(['investigations', 'legal', 'compliance', 'administration', 'it', 'finance', 'hr', 'communications']).optional(),
  location: z.string().min(1, 'Location is required').optional(),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).optional(),
  summary: z.string().min(1, 'Summary is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  keyRequirements: z.array(z.string()).min(1, 'At least one requirement is required').optional(),
  responsibilities: z.array(z.string()).min(1, 'At least one responsibility is required').optional(),
  benefits: z.string().optional().nullable(),
  closingDate: z.string().datetime().optional(),
  isPublished: z.boolean().optional(),
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update jobs
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update jobs'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateJobSchema.parse(body)

    // Check if job exists
    const existing = await prisma.job.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    // Check if slug is being changed and if it already exists
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.job.findUnique({
        where: { slug: data.slug }
      })

      if (slugExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'A job with this slug already exists'
        })
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: session.user.id
    }
    if (data.title !== undefined) updateData.title = data.title
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.department !== undefined) updateData.department = data.department
    if (data.location !== undefined) updateData.location = data.location
    if (data.type !== undefined) updateData.type = data.type
    if (data.summary !== undefined) updateData.summary = data.summary
    if (data.description !== undefined) updateData.description = data.description
    if (data.keyRequirements !== undefined) updateData.keyRequirements = data.keyRequirements
    if (data.responsibilities !== undefined) updateData.responsibilities = data.responsibilities
    if (data.benefits !== undefined) updateData.benefits = data.benefits
    if (data.closingDate !== undefined) updateData.closingDate = new Date(data.closingDate)
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished
      updateData.publishedAt = data.isPublished && !existing.publishedAt ? new Date() : existing.publishedAt
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Update job
    const job = await prisma.job.update({
      where: { id },
      data: updateData,
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
      statusMessage: 'Failed to update job'
    })
  }
})

