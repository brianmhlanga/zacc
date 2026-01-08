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
    const outcome = query.outcome as string | undefined
    const year = query.year as string | undefined
    const isPublished = query.isPublished !== undefined ? query.isPublished === 'true' : undefined

    // Build where clause
    const where: any = {}
    if (outcome) {
      where.outcome = outcome
    }
    if (year) {
      where.year = year
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished
    }

    // Fetch rulings
    const rulings = await prisma.ruling.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      include: {
        tags: true,
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

    return rulings
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch rulings'
    })
  }
})

