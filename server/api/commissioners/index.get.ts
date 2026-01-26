import { prisma } from '../../utils/prisma'

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

    const query = getQuery(event)
    const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined

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
    
    // Build where clause
    const where: any = {
      role: {
        notIn: executiveRolePatterns
      }
    }
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Fetch commissioners (excluding executives)
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

