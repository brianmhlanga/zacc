import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { enqueueNotification, buildApplicationVariables } from '../../../../utils/notifications'
import { cancelPendingNotifications } from '../../../../utils/outbox'

/**
 * Moves an application to a new pipeline stage.
 *
 * Three things happen beyond the status change, and all three matter:
 *
 *  - The legacy `status` enum is mirrored from the stage, so the original
 *    /admin/jobs screen keeps working while the new console uses stages.
 *  - Any notification still queued for this application is CANCELLED. Moving
 *    someone off a rejection stage inside the hold-back window must stop that
 *    email, which is the whole point of the delay.
 *  - The new stage's notification is queued with its configured delay and
 *    jitter, never sent inline.
 */
const bodySchema = z.object({
  stageId: z.string().min(1),
  note: z.string().max(2000).optional(),
  /** Suppress the candidate email for a correction or an internal reshuffle. */
  skipNotification: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Application id is required' })

    const { stageId, note, skipNotification } = bodySchema.parse(await readBody(event))

    const [application, stage] = await Promise.all([
      prisma.jobApplication.findUnique({
        where: { id },
        select: {
          id: true, referenceNumber: true, email: true, firstName: true, lastName: true,
          name: true, submittedAt: true, finalScore: true, isWithdrawn: true,
          stage: { select: { id: true, key: true, internalLabel: true, isRejection: true } },
          job: { select: { id: true, title: true, department: true, grade: true, closingDate: true, autoRejectDelayMinutes: true } }
        }
      }),
      prisma.recruitmentStage.findUnique({ where: { id: stageId } })
    ])

    if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    if (!stage) throw createError({ statusCode: 400, statusMessage: 'Unknown stage' })
    if (application.isWithdrawn) {
      throw createError({ statusCode: 409, statusMessage: 'This application was withdrawn by the candidate' })
    }
    if (application.stage?.id === stageId) {
      return { success: true, unchanged: true, message: 'Already at that stage.' }
    }

    // Cancel first. If the candidate was sitting on a delayed rejection and is
    // now being shortlisted, that queued email must not go out — and it must be
    // stopped before anything else can fail.
    const cancelled = await cancelPendingNotifications('application', id)

    await prisma.$transaction(async (tx: any) => {
      await tx.jobApplication.update({
        where: { id },
        data: {
          stageId,
          status: stage.legacyStatus,
          isShortlisted: stage.key === 'shortlisted' || undefined,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          ...(note ? { notes: note } : {})
        }
      })

      await tx.applicationStageEvent.create({
        data: {
          applicationId: id,
          stageId,
          fromStageKey: application.stage?.key ?? null,
          toStageKey: stage.key,
          toInternalLabel: stage.internalLabel,
          toPublicLabel: stage.publicLabel,
          note: note ?? null,
          isAutomated: false,
          changedBy: session.user.id,
          changedByName: session.user.name ?? session.user.email
        }
      })

      await tx.recruitmentAuditLog.create({
        data: {
          action: 'application.stage_changed',
          entityType: 'JobApplication',
          entityId: id,
          jobId: application.job.id,
          actorId: session.user.id,
          actorName: session.user.name ?? session.user.email,
          actorRole: session.user.role,
          summary: `${application.stage?.internalLabel ?? 'Unassigned'} → ${stage.internalLabel}`,
          detail: { cancelledNotifications: cancelled, note: note ?? null } as any
        }
      })
    }, { timeout: 20_000, maxWait: 5_000 })

    let queued: any = null
    if (stage.notifyCandidate && !skipNotification && stage.notificationTemplateId) {
      // A vacancy-level override exists so a hard-deadline post can move faster
      // than the global default.
      const delay = stage.isRejection && application.job.autoRejectDelayMinutes != null
        ? application.job.autoRejectDelayMinutes
        : stage.notificationDelayMinutes

      const template = await prisma.notificationTemplate.findUnique({
        where: { id: stage.notificationTemplateId },
        select: { key: true }
      })

      if (template) {
        queued = await enqueueNotification({
          templateKey: template.key,
          to: { email: application.email, name: application.firstName },
          variables: buildApplicationVariables({
            application: application as any,
            job: application.job as any,
            stage
          }),
          contextType: 'application',
          contextId: id,
          delayMinutes: delay,
          jitterMinutes: stage.notificationDelayJitterMinutes,
          respectSendWindow: stage.respectSendWindow
        })
      }
    }

    return {
      success: true,
      stage: { id: stage.id, internalLabel: stage.internalLabel, publicLabel: stage.publicLabel },
      cancelledNotifications: cancelled,
      notification: queued?.queued
        ? { queued: true, scheduledFor: queued.scheduledFor }
        : { queued: false },
      message: queued?.queued
        ? `Moved to ${stage.internalLabel}. Candidate notice scheduled for ${new Date(queued.scheduledFor).toLocaleString('en-GB')}.`
        : `Moved to ${stage.internalLabel}.`
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[recruitment/applications] stage change failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to change stage' })
  }
})
