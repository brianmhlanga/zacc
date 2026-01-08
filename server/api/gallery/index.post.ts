import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const createGalleryImageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  category: z.enum(['events', 'office', 'commissioners', 'activities', 'awards', 'training', 'gallery']),
  imageUrl: z.string().min(1, 'Image URL is required'),
  thumbnailUrl: z.string().optional().nullable(),
  alt: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isPublished: z.boolean().default(true)
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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can create gallery images
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can create gallery images'
      })
    }

    const body = await readBody(event)
    const data = createGalleryImageSchema.parse(body)

    // Create gallery image
    const image = await prisma.galleryImage.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl || null,
        alt: data.alt || null,
        order: data.order,
        isPublished: data.isPublished,
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

    return image
  } catch (error: any) {
    console.error('Error creating gallery image:', error)
    
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
      statusMessage: error.message || 'Failed to create gallery image'
    })
  }
})

