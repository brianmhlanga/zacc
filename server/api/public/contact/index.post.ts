import { prisma } from '../../../utils/prisma'
import { notifyContactInbox } from '../../../utils/mail'

const ALLOWED_CATEGORIES = ['GENERAL', 'COMPLAINT', 'COMPLIMENT', 'INQUIRY', 'OTHER'] as const

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

    const rawCat = body.category ?? 'GENERAL'
    const category = ALLOWED_CATEGORIES.includes(rawCat) ? rawCat : 'GENERAL'

    // Create contact submission
    const submission = await prisma.contactSubmission.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        subject: body.subject,
        message: body.message,
        category,
        isAnonymous: body.anonymous === true,
        status: 'NEW'
      }
    })

    const inbox =
      category === 'COMPLAINT'
        ? process.env.CONTACT_COMPLAINTS_EMAIL || process.env.REPORTS_INBOX_EMAIL
        : process.env.CONTACT_INBOX_EMAIL

    if (inbox) {
      void notifyContactInbox({
        to: inbox,
        subject: `[ZACC Contact] ${category}: ${body.subject}`,
        text: `New contact submission (${category})\nFrom: ${body.name} <${body.email}>\nPhone: ${body.phone || '-'}\n\n${body.message}`,
        html: `<p><strong>${category}</strong></p><p><strong>From:</strong> ${body.name} &lt;${body.email}&gt;</p><p><strong>Phone:</strong> ${body.phone || '-'}</p><p>${body.message.replace(/\n/g, '<br>')}</p>`
      }).catch((err) => console.error('[contact] notify inbox failed', err))
    }

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

