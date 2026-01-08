import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateRulingSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required').optional(),
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  summary: z.string().min(1, 'Summary is required').optional(),
  details: z.string().min(1, 'Details is required').optional(),
  court: z.string().min(1, 'Court is required').optional(),
  judge: z.string().min(1, 'Judge is required').optional(),
  date: z.string().optional(), // ISO date string
  outcome: z.enum(['Conviction', 'Acquittal', 'Settlement', 'Dismissed']).optional(),
  assetsRecovered: z.string().optional().nullable(),
  sentence: z.string().optional().nullable(),
  downloadUrl: z.string().optional().nullable(),
  year: z.string().min(1, 'Year is required').optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().optional().nullable(), // ISO date string or null
  tags: z.preprocess(
    (val) => {
      if (val === undefined || val === null) return undefined
      if (!Array.isArray(val)) return []
      return val.filter((tag): tag is string => tag !== null && tag !== undefined && typeof tag === 'string' && tag.trim().length > 0)
    },
    z.array(z.string())
  ).optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update rulings
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update rulings'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ruling ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateRulingSchema.parse(body)

    // Check if ruling exists
    const existing = await prisma.ruling.findUnique({
      where: { id },
      include: { tags: true }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Ruling not found'
      })
    }

    // If slug is being changed, check if new slug is already taken
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.ruling.findUnique({
        where: { slug: data.slug }
      })

      if (slugTaken) {
        throw createError({
          statusCode: 400,
          statusMessage: 'A ruling with this slug already exists'
        })
      }
    }

    // Prepare publishedAt date
    let publishedAt: Date | null | undefined = undefined
    if (data.publishedAt !== undefined) {
      if (data.publishedAt === null) {
        publishedAt = null
      } else if (data.publishedAt) {
        publishedAt = new Date(data.publishedAt)
      }
    } else if (data.isPublished && !existing.publishedAt) {
      // If publishing for the first time, set publishedAt to now
      publishedAt = new Date()
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: session.user.id
    }
    if (data.caseNumber !== undefined) updateData.caseNumber = data.caseNumber
    if (data.title !== undefined) updateData.title = data.title
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.summary !== undefined) updateData.summary = data.summary
    if (data.details !== undefined) updateData.details = data.details
    if (data.court !== undefined) updateData.court = data.court
    if (data.judge !== undefined) updateData.judge = data.judge
    if (data.date !== undefined) updateData.date = new Date(data.date)
    if (data.outcome !== undefined) updateData.outcome = data.outcome
    if (data.assetsRecovered !== undefined) updateData.assetsRecovered = data.assetsRecovered
    if (data.sentence !== undefined) updateData.sentence = data.sentence
    if (data.downloadUrl !== undefined) updateData.downloadUrl = data.downloadUrl
    if (data.year !== undefined) updateData.year = data.year
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt

    // Update ruling
    const ruling = await prisma.ruling.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
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

    // Update tags if provided
    if (data.tags !== undefined) {
      // Delete existing tags
      await prisma.rulingTag.deleteMany({
        where: { rulingId: id }
      })

      // Create new tags
      if (data.tags.length > 0) {
        await prisma.rulingTag.createMany({
          data: data.tags.map(tag => ({
            rulingId: id,
            tag
          }))
        })
      }

      // Fetch updated ruling with tags
      return await prisma.ruling.findUnique({
        where: { id },
        include: {
          tags: true,
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
    }

    return ruling
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
      statusMessage: 'Failed to update ruling'
    })
  }
})

