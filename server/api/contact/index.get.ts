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

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // Fetch contact submissions
    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return submissions
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contact submissions'
    })
  }
})

