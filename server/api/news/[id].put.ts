import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateNewsSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  excerpt: z.string().min(1, 'Excerpt is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  imageUrl: z.string().optional(),
  category: z.enum(['announcements', 'case-updates', 'events', 'educational', 'partnerships', 'compliance']).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().optional().nullable(), // ISO date string or null
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update news
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update news'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'News ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateNewsSchema.parse(body)

    // Check if news exists
    const existing = await prisma.news.findUnique({
      where: { id },
      include: { tags: true }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'News article not found'
      })
    }

    // If slug is being changed, check if new slug is already taken
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.news.findUnique({
        where: { slug: data.slug }
      })

      if (slugTaken) {
        throw createError({
          statusCode: 400,
          statusMessage: 'An article with this slug already exists'
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
    if (data.title !== undefined) updateData.title = data.title
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
    if (data.content !== undefined) updateData.content = data.content
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.category !== undefined) updateData.category = data.category
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription

    // Update news article
    const news = await prisma.news.update({
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
      await prisma.newsTag.deleteMany({
        where: { newsId: id }
      })

      // Create new tags
      if (data.tags.length > 0) {
        await prisma.newsTag.createMany({
          data: data.tags.map(tag => ({
            newsId: id,
            tag
          }))
        })
      }

      // Fetch updated news with tags
      return await prisma.news.findUnique({
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

    return news
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
      statusMessage: 'Failed to update news article'
    })
  }
})

