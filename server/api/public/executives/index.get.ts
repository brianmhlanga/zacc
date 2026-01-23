import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const includeInactive = query.all === 'true'
    
    // Fetch team members (executives/management)
    const executives = await prisma.team.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return executives
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch executives'
    })
  }
})
