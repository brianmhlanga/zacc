import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    const job = await prisma.job.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ],
        isPublished: true,
        isActive: true
      }
    })

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    return job
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch job'
    })
  }
})

