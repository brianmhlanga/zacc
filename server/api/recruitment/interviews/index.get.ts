import { prisma } from '../../../utils/prisma'

/** Scheduled interviews with their invitations and responses. */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const q = getQuery(event)
    const where: any = {}
    if (q.jobId) where.jobId = String(q.jobId)
    // Past interviews are hidden by default; the list is a working diary.
    if (q.includePast !== 'true') where.scheduledAt = { gte: new Date() }

    const events = await prisma.interviewEvent.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        job: { select: { id: true, title: true, department: true } },
        invitations: {
          include: {
            application: {
              select: {
                id: true, referenceNumber: true, firstName: true, lastName: true,
                name: true, email: true, finalScore: true
              }
            }
          }
        }
      }
    })

    return events.map((e: any) => {
      const counts = e.invitations.reduce(
        (acc: any, i: any) => {
          acc[i.response] = (acc[i.response] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
      return {
        ...e,
        inviteeCount: e.invitations.length,
        confirmedCount: counts.CONFIRMED ?? 0,
        pendingCount: counts.PENDING ?? 0,
        declinedCount: counts.DECLINED ?? 0,
        rescheduleCount: counts.RESCHEDULE_REQUESTED ?? 0
      }
    })
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/interviews] load failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load interviews' })
  }
})
