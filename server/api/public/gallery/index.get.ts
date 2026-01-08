import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string | undefined

    const where: any = { isPublished: true }
    if (category) {
      where.category = category
    }

    const images = await prisma.galleryImage.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return images
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch gallery images'
    })
  }
})

