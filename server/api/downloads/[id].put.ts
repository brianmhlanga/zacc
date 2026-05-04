import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateDownloadSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  category: z
    .enum([
      'forms',
      'reports',
      'policies',
      'guidelines',
      'publications',
      'legal',
      'press_releases'
    ])
    .optional(),
  fileType: z.string().min(1, 'File type is required').optional(),
  fileUrl: z.string().min(1, 'File URL is required').optional(),
  fileSize: z.number().int().positive('File size must be positive').optional(),
  year: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  order: z.number().int().optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update downloads
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update downloads'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Download ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateDownloadSchema.parse(body)

    // Check if download exists
    const existing = await prisma.download.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Download not found'
      })
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: session.user.id
    }
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.fileType !== undefined) updateData.fileType = data.fileType
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize
    if (data.year !== undefined) updateData.year = data.year
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
    if (data.order !== undefined) updateData.order = data.order

    // Update download
    const download = await prisma.download.update({
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

    return download
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
      statusMessage: 'Failed to update download'
    })
  }
})

