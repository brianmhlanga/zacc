import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Service ID is required'
      })
    }

    console.log(`[Service Detail API] Looking for service with ID: ${id}`)

    // First try to find by exact ID (don't check isVisible for detail page)
    let service = await prisma.service.findUnique({
      where: { id }
    })

    // If not found by ID, try by title (for backward compatibility)
    if (!service) {
      service = await prisma.service.findFirst({
        where: {
          title: { contains: id, mode: 'insensitive' }
        }
      })
    }

    if (!service) {
      // Check if any services exist at all
      const allServices = await prisma.service.findMany({ take: 1 })
      console.log(`[Service Detail API] Service not found with ID: ${id}`)
      console.log(`[Service Detail API] Total services in DB: ${allServices.length}`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Service not found'
      })
    }

    console.log(`[Service Detail API] Found service: ${service.title}`)
    return service
  } catch (error: any) {
    console.error('[Service Detail API] Error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch service'
    })
  }
})

