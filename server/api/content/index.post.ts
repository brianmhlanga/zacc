import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createContentSchema = z.object({
  pageKey: z.string().min(1, 'Page key is required'),
  sectionKey: z.string().min(1, 'Section key is required'),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z.string().optional(),
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  metadata: z.any().optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create content
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create content'
      })
    }

    const body = await readBody(event)
    const data = createContentSchema.parse(body)

    // Check if content already exists for this pageKey + sectionKey combination
    const existing = await prisma.pageContent.findUnique({
      where: {
        pageKey_sectionKey: {
          pageKey: data.pageKey,
          sectionKey: data.sectionKey
        }
      }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content for this page and section already exists'
      })
    }

    // Create content
    const content = await prisma.pageContent.create({
      data: {
        pageKey: data.pageKey,
        sectionKey: data.sectionKey,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
        order: data.order,
        isVisible: data.isVisible,
        metadata: data.metadata,
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

    return content
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
      statusMessage: 'Failed to create content'
    })
  }
})

