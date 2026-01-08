import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string | undefined
    const limit = query.limit ? parseInt(query.limit as string) : undefined

    // Build where clause - only published downloads
    const where: any = {
      isPublished: true
    }
    
    if (category) {
      where.category = category
    }

    // Fetch downloads
    const downloads = await prisma.download.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    return downloads
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch downloads'
    })
  }
})

