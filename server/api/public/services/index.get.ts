import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const services = await prisma.service.findMany({
      where: { isVisible: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    console.log(`[Services API] Found ${services.length} visible services`)
    return services
  } catch (error: any) {
    console.error('[Services API] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch services'
    })
  }
})

