import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, email, subject, and message are required'
      })
    }

    // Create contact submission
    const submission = await prisma.contactSubmission.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        subject: body.subject,
        message: body.message,
        isAnonymous: body.anonymous === true,
        status: 'NEW'
      }
    })

    return {
      id: submission.id,
      message: 'Your message has been submitted successfully. We will get back to you soon.'
    }
  } catch (error: any) {
    console.error('Error creating contact submission:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit contact form. Please try again or contact us directly.'
    })
  }
})

