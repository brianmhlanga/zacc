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

    // Only ADMIN and SUPER_ADMIN can delete jobs
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators can delete jobs'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID is required'
      })
    }

    // Check if job exists
    const existing = await prisma.job.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    // The outbox holds NO foreign key — contextType/contextId are loose strings
    // — and processOutboxTick selects on status and scheduledFor alone, never
    // joining back to check the subject still exists. Without this purge, a
    // rejection queued for one of these applications still sends after the
    // vacancy is gone: delete at 16:00, real email at 16:30, un-recallable.
    //
    // Whole thing in one transaction so a crash cannot leave the job deleted
    // and its messages queued with nothing left to find them by.
    await prisma.$transaction(async (tx: any) => {
      const appIds = (await tx.jobApplication.findMany({
        where: { jobId: id },
        select: { id: true }
      })).map((a: { id: string }) => a.id)

      if (appIds.length) {
        await tx.emailOutbox.deleteMany({
          where: { contextType: 'application', contextId: { in: appIds } }
        })
      }

      // Everything else cascades: applications and their documents, scores,
      // flags, stage events, messages and invitations, plus the vacancy's own
      // criteria, rules, slots, panel members and drafts.
      //
      // Audit rows are deliberately NOT deleted. jobId there is a plain column
      // with no foreign key precisely so the record outlives its subject.
      await tx.job.delete({ where: { id } })
    })

    return {
      success: true,
      message: existing._count.applications
        ? `Job deleted, along with ${existing._count.applications} application(s) and any queued notifications.`
        : 'Job deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete job'
    })
  }
})

