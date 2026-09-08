import { prisma } from '../../../../../utils/prisma'
import { requireCandidate } from '../../../../../utils/candidateAuth'
import { cancelPendingNotifications } from '../../../../../utils/outbox'

/** Lets a candidate withdraw their own application. */
export default defineEventHandler(async (event) => {
  const candidate = await requireCandidate(event)
  const reference = getRouterParam(event, 'reference')

  const application = await prisma.jobApplication.findFirst({
    where: { referenceNumber: reference, candidateId: candidate.id },
    select: { id: true, isWithdrawn: true, jobId: true }
  })
  if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  if (application.isWithdrawn) return { success: true, message: 'Already withdrawn.' }

  const withdrawnStage = await prisma.recruitmentStage.findFirst({
    where: { key: 'withdrawn' },
    select: { id: true, key: true, legacyStatus: true, internalLabel: true, publicLabel: true }
  })

  // Nothing further should reach someone who has stepped away.
  await cancelPendingNotifications('application', application.id)

  await prisma.$transaction(async (tx: any) => {
    await tx.jobApplication.update({
      where: { id: application.id },
      data: {
        isWithdrawn: true,
        withdrawnAt: new Date(),
        stageId: withdrawnStage?.id ?? undefined,
        status: withdrawnStage?.legacyStatus ?? undefined
      }
    })
    if (withdrawnStage) {
      await tx.applicationStageEvent.create({
        data: {
          applicationId: application.id,
          stageId: withdrawnStage.id,
          toStageKey: withdrawnStage.key,
          toInternalLabel: withdrawnStage.internalLabel,
          toPublicLabel: withdrawnStage.publicLabel,
          note: 'Withdrawn by the candidate',
          isAutomated: true
        }
      })
    }
    await tx.recruitmentAuditLog.create({
      data: {
        action: 'application.withdrawn',
        entityType: 'JobApplication',
        entityId: application.id,
        jobId: application.jobId,
        actorName: 'Candidate',
        summary: 'Candidate withdrew their application'
      }
    })
  }, { timeout: 20000, maxWait: 5000 })

  return { success: true, message: 'Your application has been withdrawn.' }
})
