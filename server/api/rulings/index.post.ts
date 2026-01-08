import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createRulingSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().min(1, 'Summary is required'),
  details: z.string().min(1, 'Details is required'),
  court: z.string().min(1, 'Court is required'),
  judge: z.string().min(1, 'Judge is required'),
  date: z.string(), // ISO date string
  outcome: z.enum(['Conviction', 'Acquittal', 'Settlement', 'Dismissed']),
  assetsRecovered: z.string().optional().nullable(),
  sentence: z.string().optional().nullable(),
  downloadUrl: z.string().optional().nullable(),
  year: z.string().min(1, 'Year is required'),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional().nullable(), // ISO date string
  tags: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return []
      if (!Array.isArray(val)) return []
      return val.filter((tag): tag is string => tag !== null && tag !== undefined && typeof tag === 'string' && tag.trim().length > 0)
    },
    z.array(z.string())
  ).default([])
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create rulings
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create rulings'
      })
    }

    const body = await readBody(event)
    const data = createRulingSchema.parse(body)

    // Check if slug already exists
    const existing = await prisma.ruling.findUnique({
      where: { slug: data.slug }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A ruling with this slug already exists'
      })
    }

    // Prepare publishedAt date
    let publishedAt: Date | null = null
    if (data.isPublished && data.publishedAt) {
      publishedAt = new Date(data.publishedAt)
    } else if (data.isPublished && !data.publishedAt) {
      publishedAt = new Date()
    }

    // Create ruling
    const ruling = await prisma.ruling.create({
      data: {
        caseNumber: data.caseNumber,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        details: data.details,
        court: data.court,
        judge: data.judge,
        date: new Date(data.date),
        outcome: data.outcome,
        assetsRecovered: data.assetsRecovered || null,
        sentence: data.sentence || null,
        downloadUrl: data.downloadUrl || null,
        year: data.year,
        isPublished: data.isPublished,
        publishedAt,
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

    return ruling
  } catch (error: any) {
    console.error('Error creating ruling:', error)
    
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
      statusMessage: error.message || 'Failed to create ruling'
    })
  }
})

