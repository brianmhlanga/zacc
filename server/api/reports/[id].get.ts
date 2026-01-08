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

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Report ID is required'
      })
    }

    // Fetch report with all relations
    const report = await prisma.corruptionReport.findUnique({
      where: { id },
      include: {
        files: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        updates: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!report) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Report not found'
      })
    }

    return report
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch report'
    })
  }
})

