import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { issueCandidateToken, revokeAllCandidateSessions } from '../../../../utils/candidateAuth'
import { enqueueNotification, NOTIFICATION_KEYS } from '../../../../utils/notifications'

/**
 * The things HR actually needs to do to a candidate account.
 *
 * Every one of these is a support request that currently has no answer:
 * "I never got the confirmation email", "I am locked out", "please close my
 * account". Each is audited, because these are actions taken on a member of the
 * public's account by someone who is not them.
 *
 * Deliberately NOT here: editing a candidate's profile or their application
 * answers. Those are the candidate's own record and the evidence of what they
 * submitted; an administrator quietly changing either would destroy the value of
 * both.
 */
const bodySchema = z.object({
  action: z.enum(['resend_verification', 'send_password_reset', 'unlock', 'deactivate', 'reactivate']),
  reason: z.string().max(500).optional()
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Candidate id is required' })

    const { action, reason } = bodySchema.parse(await readBody(event))

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true, emailVerifiedAt: true }
    })
    if (!candidate) throw createError({ statusCode: 404, statusMessage: 'Candidate not found' })

    const origin = getRequestURL(event).origin
    let message = ''

    switch (action) {
      case 'resend_verification': {
        if (candidate.emailVerifiedAt) {
          throw createError({ statusCode: 400, statusMessage: 'This address is already confirmed.' })
        }
        const token = await issueCandidateToken(candidate.id, 'EMAIL_VERIFY')
        await enqueueNotification({
          templateKey: NOTIFICATION_KEYS.CANDIDATE_VERIFY_EMAIL,
          to: { email: candidate.email, name: candidate.firstName },
          variables: {
            firstName: candidate.firstName,
            verifyUrl: `${origin}/candidate/verify?token=${token}`
          },
          contextType: 'candidate',
          contextId: candidate.id,
          // An account someone is waiting on is not something to hold back or
          // to defer to office hours.
          delayMinutes: 0,
          respectSendWindow: false
        })
        message = `A new confirmation link has been queued for ${candidate.email}.`
        break
      }

      case 'send_password_reset': {
        const token = await issueCandidateToken(candidate.id, 'PASSWORD_RESET')
        await enqueueNotification({
          templateKey: NOTIFICATION_KEYS.CANDIDATE_PASSWORD_RESET,
          to: { email: candidate.email, name: candidate.firstName },
          variables: {
            firstName: candidate.firstName,
            resetUrl: `${origin}/candidate/reset-password?token=${token}`
          },
          contextType: 'candidate',
          contextId: candidate.id,
          delayMinutes: 0,
          respectSendWindow: false
        })
        message = `A password reset link has been queued for ${candidate.email}.`
        break
      }

      case 'unlock': {
        await prisma.candidate.update({
          where: { id },
          data: { lockedUntil: null, failedLoginCount: 0 }
        })
        message = 'The account is unlocked and the failed-attempt count is reset.'
        break
      }

      case 'deactivate': {
        await prisma.candidate.update({ where: { id }, data: { isActive: false } })
        // Sessions go too, or the account stays usable until the cookie expires
        // — which would make "deactivated" mean nothing for up to its lifetime.
        await revokeAllCandidateSessions(id)
        message = 'The account is deactivated and every active session revoked.'
        break
      }

      case 'reactivate': {
        await prisma.candidate.update({ where: { id }, data: { isActive: true } })
        message = 'The account is active again. The candidate will need to sign in.'
        break
      }
    }

    await prisma.recruitmentAuditLog.create({
      data: {
        action: `candidate.${action}`,
        entityType: 'Candidate',
        entityId: id,
        actorId: (session.user as any).id ?? null,
        actorName: (session.user as any).name ?? (session.user as any).email ?? null,
        actorRole: (session.user as any).role ?? null,
        summary: `${action.replace(/_/g, ' ')} — ${candidate.email}${reason ? ` (${reason})` : ''}`,
        detail: { email: candidate.email, reason: reason ?? null } as any,
        ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null
      }
    })

    return { success: true, message }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message ?? 'Validation error' })
    }
    console.error('[recruitment/candidates] action failed', error)
    throw createError({ statusCode: 500, statusMessage: 'The action could not be completed' })
  }
})
