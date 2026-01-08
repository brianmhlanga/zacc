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

    // Only ADMIN and SUPER_ADMIN can delete contact submissions
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can delete contact submissions'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Submission ID is required'
      })
    }

    // Check if submission exists
    const existing = await prisma.contactSubmission.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contact submission not found'
      })
    }

    // Delete contact submission
    await prisma.contactSubmission.delete({
      where: { id }
    })

    return { success: true, message: 'Contact submission deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete contact submission'
    })
  }
})

