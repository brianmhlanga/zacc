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
        statusMessage: 'Submission ID is required'
      })
    }

    // Fetch contact submission
    const submission = await prisma.contactSubmission.findUnique({
      where: { id }
    })

    if (!submission) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contact submission not found'
      })
    }

    return submission
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contact submission'
    })
  }
})

