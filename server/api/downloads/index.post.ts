import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createDownloadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  category: z.enum([
    'forms',
    'reports',
    'policies',
    'guidelines',
    'publications',
    'legal',
    'press_releases'
  ]),
  fileType: z.string().min(1, 'File type is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  year: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  order: z.number().int().default(0)
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create downloads
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create downloads'
      })
    }

    const body = await readBody(event)
    const data = createDownloadSchema.parse(body)

    // Create download
    const download = await prisma.download.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        year: data.year || null,
        isPublished: data.isPublished,
        order: data.order,
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

    return download
  } catch (error: any) {
    console.error('Error creating download:', error)
    
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
      statusMessage: error.message || 'Failed to create download'
    })
  }
})

