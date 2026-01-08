import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateContactSubmissionSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED']).optional(),
  response: z.string().optional().nullable()
})

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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update contact submissions
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update contact submissions'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Submission ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateContactSubmissionSchema.parse(body)

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

    // Prepare update data
    const updateData: any = {}
    if (data.status !== undefined) {
      updateData.status = data.status
      // Set respondedAt if status is RESPONDED and response is provided
      if (data.status === 'RESPONDED' && data.response) {
        updateData.respondedAt = new Date()
      }
    }
    if (data.response !== undefined) {
      updateData.response = data.response
      // Set respondedAt if response is provided and status is RESPONDED
      if (data.response && (!data.status || data.status === 'RESPONDED')) {
        updateData.respondedAt = new Date()
      }
    }

    // Update contact submission
    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: updateData
    })

    return submission
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    // Handle validation errors
    if (error.issues) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || 'Validation error'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update contact submission'
    })
  }
})

