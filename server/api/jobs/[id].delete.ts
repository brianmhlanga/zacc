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

    // Only ADMIN and SUPER_ADMIN can delete jobs
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can delete jobs'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID is required'
      })
    }

    // Check if job exists
    const existing = await prisma.job.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    // Delete job (applications will be cascade deleted)
    await prisma.job.delete({
      where: { id }
    })

    return { success: true, message: 'Job deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete job'
    })
  }
})

