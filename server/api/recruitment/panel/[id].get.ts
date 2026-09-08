import { prisma } from '../../../utils/prisma'
import { projectApplication, resolvePanelViewer } from '../../../utils/applicationProjection'

/**
 * One application, projected for the signed-in reviewer, plus the criteria they
 * are expected to score and any scores they have already entered.
 *
 * Masking happens here rather than in the page: fields this reviewer may not see
 * are removed from the payload entirely.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Application id is required' })

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true, title: true, department: true, grade: true,
            panelAggregation: true, panelSpreadThreshold: true,
            criteria: {
              where: { isPanelScored: true },
              orderBy: { sortOrder: 'asc' },
              select: { id: true, key: true, label: true, description: true, bucket: true, maxPoints: true, config: true }
            }
          }
        },
        stage: { select: { key: true, internalLabel: true, publicLabel: true, colorHex: true } },
        qualifications: true,
        employments: { orderBy: { sortOrder: 'asc' } },
        skills: true,
        documents: { select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, label: true, slotKey: true } },
        criterionScores: { select: { criterionKey: true, normalizedPct: true, weightedPoints: true, explanation: true, pending: true } }
      }
    })

    if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })

    const viewer = await resolvePanelViewer(prisma, application.jobId, session.user.id, session.user.role)
    if (!viewer) {
      // Not on this panel. 404 rather than 403 — whether a particular
      // application exists is not this user's business.
      throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    }

    const myScores = await prisma.applicationPanelScore.findMany({
      where: { applicationId: id, reviewerId: session.user.id },
      select: { criterionId: true, points: true, comment: true, isSubmitted: true }
    })

    const myReview = await prisma.applicationReview.findUnique({
      where: { applicationId_reviewerId: { applicationId: id, reviewerId: session.user.id } },
      select: { recommendation: true, comments: true, isSubmitted: true }
    })

    // Other reviewers' input, only once this reviewer has committed their own.
    const hasSubmitted = myScores.some((s: any) => s.isSubmitted)
    let others: any[] = []
    if (viewer.kind === 'admin' || (viewer.canSeeOtherScores && hasSubmitted)) {
      others = await prisma.applicationPanelScore.findMany({
        where: { applicationId: id, isSubmitted: true, reviewerId: { not: session.user.id } },
        select: {
          criterionId: true, points: true, maxPoints: true, comment: true,
          reviewer: { select: { id: true, name: true, email: true } }
        }
      })
    }

    return {
      application: projectApplication(application as any, viewer),
      criteria: application.job.criteria,
      myScores,
      myReview,
      otherScores: others,
      viewer: {
        kind: viewer.kind,
        masked: viewer.kind === 'panel'
          ? {
              identity: !viewer.canSeeIdentity,
              demographics: !viewer.canSeeDemographics,
              otherScores: !viewer.canSeeOtherScores
            }
          : null
      },
      hasSubmitted
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/panel] detail failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load the application' })
  }
})
