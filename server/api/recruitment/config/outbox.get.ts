import { prisma } from '../../../utils/prisma'
import { isMailConfigured } from '../../../utils/mail'

/**
 * The send queue.
 *
 * Exists mostly so a misconfigured mail transport is visible rather than silent —
 * queued notices park as SKIPPED instead of vanishing, and this is where anyone
 * would notice.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const q = getQuery(event)
    const where: any = {}
    if (q.status) where.status = String(q.status)

    const [rows, counts] = await Promise.all([
      prisma.emailOutbox.findMany({
        where,
        orderBy: [{ scheduledFor: 'asc' }],
        take: 200,
        select: {
          id: true, templateKey: true, toEmail: true, toName: true, subject: true,
          status: true, scheduledFor: true, sentAt: true, attempts: true,
          maxAttempts: true, lastError: true, contextType: true, contextId: true,
          createdAt: true
        }
      }),
      prisma.emailOutbox.groupBy({ by: ['status'], _count: { _all: true } })
    ])

    return {
      rows,
      counts: Object.fromEntries(counts.map((c: any) => [c.status, c._count._all])),
      mailConfigured: isMailConfigured(),
      pollerDisabled: process.env.RECRUITMENT_OUTBOX_DISABLED === '1'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/config] outbox load failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load the send queue' })
  }
})
