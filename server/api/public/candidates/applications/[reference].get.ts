import { prisma } from '../../../../utils/prisma'
import { requireCandidate } from '../../../../utils/candidateAuth'
import { signFileUrl } from '../../../../utils/signedFileUrl'
import {
  resolveCandidateStage,
  filterCandidateTimeline,
  REJECTION_TEMPLATE_KEYS
} from '../../../../utils/candidateProjection'

/**
 * One application, as the candidate is allowed to see it.
 *
 * Only stages flagged `showOnCandidateTimeline` appear, and only their public
 * labels. Scores, panel comments and internal notes are never selected — the
 * safest way to avoid leaking them is not to load them.
 *
 * A rejection whose notice is still queued is withheld here: see
 * server/utils/candidateProjection.ts for why.
 */
export default defineEventHandler(async (event) => {
  const candidate = await requireCandidate(event)
  const reference = getRouterParam(event, 'reference')

  const application = await prisma.jobApplication.findFirst({
    where: { referenceNumber: reference, candidateId: candidate.id },
    select: {
      id: true, referenceNumber: true, submittedAt: true, isWithdrawn: true,
      withdrawnAt: true, createdAt: true,
      job: { select: { title: true, department: true, grade: true, dutyStation: true, closingDate: true } },
      stage: {
        select: {
          key: true, publicLabel: true, publicDescription: true, colorHex: true,
          category: true, sortOrder: true, isRejection: true, isTerminal: true
        }
      },
      documents: { select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, label: true, verification: true } },
      stageEvents: {
        where: { stage: { showOnCandidateTimeline: true } },
        orderBy: { createdAt: 'asc' },
        // toStageKey drives both the withheld-rejection filter and the fallback
        // to the last stage the candidate could legitimately have seen.
        select: { id: true, toStageKey: true, toPublicLabel: true, createdAt: true }
      },
      messages: {
        where: { isInternal: false, direction: 'TO_CANDIDATE' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, fromLabel: true, subject: true, body: true, createdAt: true }
      },
      invitations: {
        select: {
          id: true, response: true, confirmByDate: true,
          event: {
            select: {
              title: true, mode: true, venue: true, meetingUrl: true,
              scheduledAt: true, durationMinutes: true, panelSummary: true, bringItems: true
            }
          }
        }
      }
    }
  })

  if (!application) {
    throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  }

  const [allStages, pendingRejections] = await Promise.all([
    prisma.recruitmentStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        key: true, publicLabel: true, publicDescription: true, colorHex: true,
        sortOrder: true, category: true, isRejection: true, isTerminal: true,
        showOnCandidateTimeline: true
      }
    }),
    // An unsent rejection means the outcome is still being withheld. CANCELLED
    // and SENT rows are both excluded: one never happens, the other already has.
    prisma.emailOutbox.count({
      where: {
        contextType: 'application',
        contextId: application.id,
        status: { in: ['SCHEDULED', 'CLAIMED', 'SKIPPED'] },
        templateKey: { in: [...REJECTION_TEMPLATE_KEYS] }
      }
    })
  ])

  const byKey = new Map(allStages.map((s: any) => [s.key, s]))
  const priorStages = application.stageEvents
    .map((e: any) => (e.toStageKey ? byKey.get(e.toStageKey) : null))
    .filter(Boolean)

  const resolved = resolveCandidateStage({
    currentStage: application.stage,
    priorStages,
    hasPendingRejection: pendingRejections > 0
  })

  const rejectionStageKeys = allStages.filter((s: any) => s.isRejection).map((s: any) => s.key)

  return {
    application: {
      ...application,
      // Overwritten, not merged: the raw rejection stage must not survive here.
      stage: resolved.stage,
      stageEvents: filterCandidateTimeline(application.stageEvents, {
        held: resolved.held,
        rejectionStageKeys
      }),
      documents: application.documents.map((d: any) => ({
        ...d,
        signedUrl: d.fileUrl ? signFileUrl(d.fileUrl, 1800) : null
      }))
    },
    stages: allStages
      .filter((s: any) => s.showOnCandidateTimeline)
      .map(({ showOnCandidateTimeline, ...s }: any) => s)
  }
})
