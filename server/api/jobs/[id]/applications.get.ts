import { prisma } from '../../../utils/prisma'

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
    const query = getQuery(event)
    const status = query.status as string | undefined

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id }
    })

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    // Build where clause
    const where: any = { jobId: id }
    if (status) {
      where.status = status
    }

    // Fetch applications
    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return applications
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch applications'
    })
  }
})

