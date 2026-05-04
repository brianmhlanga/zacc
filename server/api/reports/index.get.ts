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
    const status = query.status as string | undefined
    const priority = query.priority as string | undefined
    const corruptionType = query.corruptionType as string | undefined
    const archivedOnly = String(query.archived || '') === 'true'

    // Build where clause
    const where: any = {}
    where.isArchived = archivedOnly
    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }
    if (corruptionType) {
      where.corruptionType = corruptionType
    }

    // Fetch reports
    const reports = await prisma.corruptionReport.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        files: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            fileType: true
          }
        },
        updates: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            files: true,
            updates: true
          }
        }
      }
    })

    return reports
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch reports'
    })
  }
})

