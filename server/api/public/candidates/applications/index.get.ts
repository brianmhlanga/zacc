import { prisma } from '../../../../utils/prisma'
import { requireCandidate } from '../../../../utils/candidateAuth'
import { resolveCandidateStage, REJECTION_TEMPLATE_KEYS } from '../../../../utils/candidateProjection'

/**
 * The candidate's own applications, with PUBLIC stage labels only.
 *
 * A rejection whose notice is still queued is withheld here too — the dashboard
 * lists the same status pill as the tracking page, so masking one and not the
 * other would leak the outcome on the way in.
 */
export default defineEventHandler(async (event) => {
  const candidate = await requireCandidate(event)

  const applications = await prisma.jobApplication.findMany({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, referenceNumber: true, submittedAt: true, isWithdrawn: true,
      job: { select: { title: true, department: true, closingDate: true, slug: true } },
      stage: {
        // internalLabel is deliberately not selected.
        select: {
          key: true, publicLabel: true, publicDescription: true, colorHex: true,
          category: true, sortOrder: true, isRejection: true, isTerminal: true
        }
      },
      stageEvents: {
        where: { stage: { showOnCandidateTimeline: true } },
        orderBy: { createdAt: 'asc' },
        select: { toStageKey: true }
      },
      _count: { select: { documents: true } }
    }
  })

  const drafts = await prisma.applicationDraft.findMany({
    where: { candidateId: candidate.id },
    select: {
      currentStep: true, updatedAt: true,
      job: { select: { title: true, slug: true, closingDate: true, department: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // One query for the whole list rather than one per row.
  const applicationIds = applications.map((a: any) => a.id)
  const held = new Set<string>()
  if (applicationIds.length) {
    const pending = await prisma.emailOutbox.findMany({
      where: {
        contextType: 'application',
        contextId: { in: applicationIds },
        status: { in: ['SCHEDULED', 'CLAIMED', 'SKIPPED'] },
        templateKey: { in: [...REJECTION_TEMPLATE_KEYS] }
      },
      select: { contextId: true }
    })
    for (const p of pending) if (p.contextId) held.add(p.contextId)
  }

  const allStages = await prisma.recruitmentStage.findMany({
    where: { isActive: true },
    select: {
      key: true, publicLabel: true, publicDescription: true, colorHex: true,
      category: true, sortOrder: true, isRejection: true, isTerminal: true
    }
  })
  const byKey = new Map(allStages.map((s: any) => [s.key, s]))

  return {
    applications: applications.map((a: any) => {
      const resolved = resolveCandidateStage({
        currentStage: a.stage,
        priorStages: a.stageEvents.map((e: any) => (e.toStageKey ? byKey.get(e.toStageKey) : null)),
        hasPendingRejection: held.has(a.id)
      })
      // stageEvents were only loaded to resolve the fallback; they are not part
      // of this payload.
      const { stageEvents, ...rest } = a
      return { ...rest, stage: resolved.stage }
    }),
    drafts
  }
})
