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

    // Build where clause
    const where: any = {}
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Fetch team members (executives)
    const team = await prisma.team.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return team
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
