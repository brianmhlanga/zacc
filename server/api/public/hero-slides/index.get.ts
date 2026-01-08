import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    return slides
  } catch (error: any) {
    console.error('[Hero Slides API] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch hero slides'
    })
  }
})

