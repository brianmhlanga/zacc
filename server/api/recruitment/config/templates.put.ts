import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { renderNotification, extractTokens } from '../../../utils/templateRenderer'

/**
 * Updates one notification template.
 *
 * The body is rendered against a sample before saving. An unresolved placeholder
 * would otherwise reach a candidate as a blank, and the first anyone would know
 * about it is the email that went out.
 */
const bodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullish(),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Body is required'),
  bodyText: z.string().nullish(),
  isActive: z.boolean()
})

/** Stand-in values used only to check a template renders. */
const SAMPLE = {
  firstName: 'Tariro', lastName: 'Chikafu', fullName: 'Tariro Chikafu',
  email: 'candidate@example.com', reference: 'ZACC-APP-2026-00318',
  status: 'Under review', statusDescription: 'Your application is being reviewed.',
  score: 82, submittedAt: new Date().toISOString(),
  publicReason: 'Sample reason.', documentNote: 'Sample note.',
  messageSubject: 'Sample subject', messageBody: '<p>Sample message.</p>',
  verifyUrl: 'https://zacc.co.zw/candidate/verify?token=sample',
  resetUrl: 'https://zacc.co.zw/candidate/reset-password?token=sample',
  vacancy: { title: 'Senior Investigations Officer', department: 'Investigations', grade: 'D3', closingDate: new Date().toISOString() },
  interview: {
    date: new Date().toISOString(), time: '09:30', venue: 'ZACC Head Office',
    bring: ['Original certificates'], confirmBy: new Date().toISOString()
  },
  commission: { name: 'ZACC', shortName: 'ZACC', email: 'recruitment@zacc.co.zw', siteUrl: 'https://zacc.co.zw' }
}

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const data = bodySchema.parse(await readBody(event))

    const existing = await prisma.notificationTemplate.findUnique({
      where: { id: data.id },
      select: { id: true, key: true, isSystem: true }
    })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Template not found' })

    // A system template drives a pipeline stage; disabling it would silently
    // stop those notices.
    if (existing.isSystem && !data.isActive) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This template is used by a pipeline stage and cannot be deactivated. Edit its content instead.'
      })
    }

    const rendered = renderNotification(
      { subject: data.subject, bodyHtml: data.bodyHtml, bodyText: data.bodyText },
      SAMPLE
    )

    if (rendered.missing.length) {
      const unique = [...new Set(rendered.missing)]
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown placeholder(s): ${unique.map((t) => `{{${t}}}`).join(', ')}. A candidate would receive a blank there.`
      })
    }

    await prisma.notificationTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description ?? null,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText ?? null,
        isActive: data.isActive,
        variables: extractTokens(`${data.subject} ${data.bodyHtml}`) as any,
        updatedBy: session.user.id
      }
    })

    return {
      success: true,
      preview: { subject: rendered.subject, html: rendered.html, text: rendered.text },
      message: 'Template saved.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[recruitment/config] template save failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save template' })
  }
})
