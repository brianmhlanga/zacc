import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { enqueueNotification, buildApplicationVariables, NOTIFICATION_KEYS } from '../../../utils/notifications'

/**
 * Schedules an interview and invites the selected applications.
 *
 * Invitations are queued through the outbox like every other candidate email, so
 * they respect the working-hours send window rather than arriving at 03:00.
 */
const bodySchema = z.object({
  jobId: z.string().min(1),
  title: z.string().min(1, 'Give the interview a title'),
  mode: z.enum(['IN_PERSON', 'VIRTUAL', 'TELEPHONE']).default('IN_PERSON'),
  venue: z.string().nullish(),
  meetingUrl: z.string().nullish(),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().min(5).max(600).default(45),
  panelSummary: z.array(z.string()).default([]),
  bringItems: z.array(z.string()).default([]),
  notes: z.string().nullish(),
  applicationIds: z.array(z.string()).default([]),
  confirmByDate: z.string().nullish(),
  sendInvitations: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const data = bodySchema.parse(await readBody(event))

    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      select: { id: true, title: true, department: true, grade: true, closingDate: true }
    })
    if (!job) throw createError({ statusCode: 400, statusMessage: 'Unknown vacancy' })

    const created = await prisma.$transaction(async (tx: any) => {
      const ev = await tx.interviewEvent.create({
        data: {
          jobId: data.jobId,
          title: data.title,
          mode: data.mode,
          venue: data.venue ?? null,
          meetingUrl: data.meetingUrl ?? null,
          scheduledAt: new Date(data.scheduledAt),
          durationMinutes: data.durationMinutes,
          panelSummary: data.panelSummary as any,
          bringItems: data.bringItems as any,
          notes: data.notes ?? null,
          createdBy: session.user.id
        }
      })

      if (data.applicationIds.length) {
        await tx.interviewInvitation.createMany({
          data: data.applicationIds.map((applicationId) => ({
            eventId: ev.id,
            applicationId,
            confirmByDate: data.confirmByDate ? new Date(data.confirmByDate) : null,
            sentAt: data.sendInvitations ? new Date() : null
          })),
          skipDuplicates: true
        })
      }

      await tx.recruitmentAuditLog.create({
        data: {
          action: 'interview.scheduled',
          entityType: 'InterviewEvent',
          entityId: ev.id,
          jobId: data.jobId,
          actorId: session.user.id,
          actorName: session.user.name ?? session.user.email,
          actorRole: session.user.role,
          summary: `${data.title} — ${data.applicationIds.length} invitee(s)`
        }
      })

      return ev
    }, { timeout: 20_000, maxWait: 5_000 })

    let queued = 0
    if (data.sendInvitations && data.applicationIds.length) {
      const applications = await prisma.jobApplication.findMany({
        where: { id: { in: data.applicationIds } },
        select: {
          id: true, email: true, firstName: true, lastName: true, name: true,
          referenceNumber: true, submittedAt: true, finalScore: true
        }
      })

      const when = new Date(data.scheduledAt)
      for (const a of applications) {
        const res = await enqueueNotification({
          templateKey: NOTIFICATION_KEYS.INTERVIEW_INVITATION,
          to: { email: a.email, name: a.firstName },
          variables: buildApplicationVariables({
            application: a as any,
            job: job as any,
            stage: null,
            extra: {
              interview: {
                date: when.toISOString(),
                time: when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                venue: data.venue || data.meetingUrl || 'To be confirmed',
                bring: data.bringItems,
                confirmBy: data.confirmByDate ?? null
              }
            }
          }),
          contextType: 'interview',
          contextId: created.id,
          // Invitations are time-sensitive: no artificial hold, but still
          // snapped into working hours.
          delayMinutes: 0
        })
        if (res.queued) queued++
      }
    }

    return {
      success: true,
      id: created.id,
      invited: data.applicationIds.length,
      queued,
      message: `Interview scheduled. ${queued} invitation(s) queued.`
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[recruitment/interviews] create failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to schedule interview' })
  }
})
