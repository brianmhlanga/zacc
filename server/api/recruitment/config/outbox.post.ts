import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

/**
 * Requeue or cancel messages in the send queue.
 *
 * Requeue exists for the SKIPPED case: mail was not configured when the notice
 * was due, and once it is, those messages should go rather than be lost.
 */
const bodySchema = z.object({
  action: z.enum(['requeue', 'cancel']),
  ids: z.array(z.string()).min(1).max(500)
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const { action, ids } = bodySchema.parse(await readBody(event))

    if (action === 'requeue') {
      const res = await prisma.emailOutbox.updateMany({
        // Never resurrect something already SENT — that would double-send.
        where: { id: { in: ids }, status: { in: ['SKIPPED', 'FAILED', 'CANCELLED'] } },
        data: { status: 'SCHEDULED', scheduledFor: new Date(), attempts: 0, lastError: null, claimToken: null, claimedAt: null }
      })
      return { success: true, affected: res.count, message: `${res.count} message(s) requeued.` }
    }

    const res = await prisma.emailOutbox.updateMany({
      where: { id: { in: ids }, status: { in: ['SCHEDULED', 'SKIPPED', 'FAILED'] } },
      data: { status: 'CANCELLED' }
    })
    return { success: true, affected: res.count, message: `${res.count} message(s) cancelled.` }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[recruitment/config] outbox action failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update the queue' })
  }
})
