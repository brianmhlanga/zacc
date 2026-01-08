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
    const department = query.department as string | undefined
    const isPublished = query.isPublished !== undefined ? query.isPublished === 'true' : undefined
    const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined

    // Build where clause
    const where: any = {}
    if (department) {
      where.department = department
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished
    }
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Fetch jobs
    const jobs = await prisma.job.findMany({
      where,
      orderBy: [
        { closingDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
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
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    return jobs
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch jobs'
    })
  }
})

