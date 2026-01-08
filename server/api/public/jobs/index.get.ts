import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const department = query.department as string | undefined

    const where: any = {
      isPublished: true,
      isActive: true
    }

    // Only show jobs that haven't closed yet
    where.closingDate = {
      gte: new Date()
    }

    if (department) {
      where.department = department
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: [
        { closingDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return jobs
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch jobs'
    })
  }
})

