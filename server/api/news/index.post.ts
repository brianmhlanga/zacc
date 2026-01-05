import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createNewsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().optional(),
  category: z.enum(['announcements', 'case-updates', 'events', 'educational', 'partnerships', 'compliance']),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional(), // ISO date string
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).default([])
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create news
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create news'
      })
    }

    const body = await readBody(event)
    const data = createNewsSchema.parse(body)

    // Check if slug already exists
    const existing = await prisma.news.findUnique({
      where: { slug: data.slug }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'An article with this slug already exists'
      })
    }

    // Prepare publishedAt date
    let publishedAt: Date | null = null
    if (data.isPublished && data.publishedAt) {
      publishedAt = new Date(data.publishedAt)
    } else if (data.isPublished && !data.publishedAt) {
      publishedAt = new Date()
    }

    // Create news article
    const news = await prisma.news.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        imageUrl: data.imageUrl,
        category: data.category,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
        publishedAt,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        tags: {
          create: data.tags.map(tag => ({ tag }))
        }
      },
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

    return news
  } catch (error: any) {
    console.error('Error creating news article:', error)
    
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
      statusMessage: error.message || 'Failed to create news article'
    })
  }
})

