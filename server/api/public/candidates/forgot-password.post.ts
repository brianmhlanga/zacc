import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { issueCandidateToken } from '../../../utils/candidateAuth'
import { enqueueNotification, NOTIFICATION_KEYS } from '../../../utils/notifications'

const bodySchema = z.object({ email: z.string().email() })

export default defineEventHandler(async (event) => {
  try {
    const { email } = bodySchema.parse(await readBody(event))

    const candidate = await prisma.candidate.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, firstName: true, isActive: true }
    })

    if (candidate?.isActive) {
      const token = await issueCandidateToken(candidate.id, 'PASSWORD_RESET')
      const origin = getRequestURL(event).origin

      await enqueueNotification({
        templateKey: NOTIFICATION_KEYS.CANDIDATE_PASSWORD_RESET,
        to: { email: candidate.email, name: candidate.firstName },
        variables: {
          firstName: candidate.firstName,
          resetUrl: `${origin}/candidate/reset-password?token=${token}`,
          commission: {
            name: 'Zimbabwe Anti-Corruption Commission', shortName: 'ZACC',
            email: process.env.REPORTS_INBOX_EMAIL || 'recruitment@zacc.co.zw',
            siteUrl: process.env.NUXT_PUBLIC_SITE_URL || origin
          }
        },
        contextType: 'candidate',
        contextId: candidate.id,
        delayMinutes: 0,
        respectSendWindow: false
      })
    }

    // Always the same answer, so this cannot be used to enumerate accounts.
    return {
      success: true,
      message: 'If that address has an account, a reset link is on its way.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address' })
    }
    console.error('[candidates] forgot-password failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not process the request' })
  }
})
