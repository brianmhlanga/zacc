import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { resolvePanelViewer } from '../../../../utils/applicationProjection'
import { scoreAndPersist } from '../../../../utils/recruitmentScoring'

/**
 * Saves this reviewer's panel scores, then recomputes the blended total.
 *
 * Drafts and submissions use the same endpoint; `submit: true` is what makes the
 * scores visible to colleagues and countable in the aggregate. Until then a
 * manual criterion stays *pending* and is excluded from the denominator rather
 * than dragging the total down as a zero.
 */
const bodySchema = z.object({
  scores: z.array(z.object({
    criterionId: z.string().min(1),
    points: z.number().min(0),
    comment: z.string().max(2000).nullish()
  })),
  recommendation: z.enum(['SHORTLIST', 'RESERVE', 'REJECT']).nullish(),
  comments: z.string().max(4000).nullish(),
  submit: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Application id is required' })

    const body = bodySchema.parse(await readBody(event))

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      select: {
        id: true, jobId: true, isWithdrawn: true,
        job: { select: { criteria: { where: { isPanelScored: true }, select: { id: true, maxPoints: true, label: true } } } }
      }
    })
    if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    if (application.isWithdrawn) {
      throw createError({ statusCode: 409, statusMessage: 'This application was withdrawn' })
    }

    const viewer = await resolvePanelViewer(prisma, application.jobId, session.user.id, session.user.role)
    if (!viewer) throw createError({ statusCode: 404, statusMessage: 'Application not found' })

    const criteriaById = new Map(application.job.criteria.map((c: any) => [c.id, c]))

    // Reject unknown criteria and out-of-range points rather than clamping: a
    // reviewer typing 150 into a /100 field has made a mistake worth surfacing.
    for (const s of body.scores) {
      const criterion: any = criteriaById.get(s.criterionId)
      if (!criterion) {
        throw createError({ statusCode: 400, statusMessage: 'Unknown criterion for this vacancy' })
      }
      if (s.points > criterion.maxPoints) {
        throw createError({
          statusCode: 400,
          statusMessage: `"${criterion.label}" is out of ${criterion.maxPoints} — ${s.points} is too high`
        })
      }
    }

    if (body.submit) {
      const missing = application.job.criteria.filter(
        (c: any) => !body.scores.some((s) => s.criterionId === c.id)
      )
      if (missing.length) {
        throw createError({
          statusCode: 400,
          statusMessage: `Score every criterion before submitting. Missing: ${missing.map((m: any) => m.label).join(', ')}`
        })
      }
    }

    await prisma.$transaction(async (tx: any) => {
      for (const s of body.scores) {
        const criterion: any = criteriaById.get(s.criterionId)
        await tx.applicationPanelScore.upsert({
          where: {
            applicationId_criterionId_reviewerId: {
              applicationId: id, criterionId: s.criterionId, reviewerId: session.user.id
            }
          },
          update: {
            points: s.points,
            maxPoints: criterion.maxPoints,
            comment: s.comment ?? null,
            isSubmitted: body.submit,
            submittedAt: body.submit ? new Date() : null
          },
          create: {
            applicationId: id,
            criterionId: s.criterionId,
            reviewerId: session.user.id,
            points: s.points,
            maxPoints: criterion.maxPoints,
            comment: s.comment ?? null,
            isSubmitted: body.submit,
            submittedAt: body.submit ? new Date() : null
          }
        })
      }

      if (body.recommendation || body.comments || body.submit) {
        await tx.applicationReview.upsert({
          where: { applicationId_reviewerId: { applicationId: id, reviewerId: session.user.id } },
          update: {
            recommendation: body.recommendation ?? undefined,
            comments: body.comments ?? undefined,
            isSubmitted: body.submit,
            submittedAt: body.submit ? new Date() : null
          },
          create: {
            applicationId: id,
            reviewerId: session.user.id,
            recommendation: body.recommendation ?? null,
            comments: body.comments ?? null,
            isSubmitted: body.submit,
            submittedAt: body.submit ? new Date() : null
          }
        })
      }

      if (body.submit) {
        await tx.recruitmentAuditLog.create({
          data: {
            action: 'panel.scores_submitted',
            entityType: 'JobApplication',
            entityId: id,
            jobId: application.jobId,
            actorId: session.user.id,
            actorName: session.user.name ?? session.user.email,
            actorRole: session.user.role,
            summary: `Submitted ${body.scores.length} panel score(s)`,
            detail: { recommendation: body.recommendation ?? null } as any
          }
        })
      }
    }, { timeout: 20_000, maxWait: 5_000 })

    // Recompute outside the transaction: scoring reads panel scores back and
    // writes its own rows, and nesting the two would hold locks far longer.
    const rescored = body.submit ? await scoreAndPersist(id) : null

    return {
      success: true,
      submitted: body.submit,
      finalScore: rescored?.finalScore ?? null,
      message: body.submit
        ? 'Scores submitted. The panel aggregate has been recalculated.'
        : 'Draft saved. Nothing is visible to colleagues until you submit.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[recruitment/panel] score save failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save scores' })
  }
})
