import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const includeInactive = query.all === 'true'
    
    // Executive roles that should be excluded from commissioners
    // These are management/executive positions, not commissioners
    const executiveRolePatterns = [
      'Executive Secretary',
      'General Manager',
      'Manager',
      'Director',
      'Deputy Director',
      'Coordinator',
      'Officer',
      'Assistant'
    ]
    
    // Build where clause to exclude executives
    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }
    
    // Exclude roles that match executive patterns
    where.role = {
      notIn: executiveRolePatterns
    }
    
    // Fetch commissioners - exclude executives by role, active only by default, or all if requested
    const commissioners = await prisma.commissioner.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return commissioners
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch commissioners'
    })
  }
})

