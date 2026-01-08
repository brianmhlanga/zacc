import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateGalleryImageSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  category: z.enum(['events', 'office', 'commissioners', 'activities', 'awards', 'training', 'gallery']).optional(),
  imageUrl: z.string().min(1, 'Image URL is required').optional(),
  thumbnailUrl: z.string().optional().nullable(),
  alt: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional()
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update gallery images
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update gallery images'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Gallery image ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateGalleryImageSchema.parse(body)

    // Check if gallery image exists
    const existing = await prisma.galleryImage.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Gallery image not found'
      })
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: session.user.id
    }
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl
    if (data.alt !== undefined) updateData.alt = data.alt
    if (data.order !== undefined) updateData.order = data.order
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished

    // Update gallery image
    const image = await prisma.galleryImage.update({
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

    return image
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
      statusMessage: 'Failed to update gallery image'
    })
  }
})

