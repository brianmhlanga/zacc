import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { vacancySchemeSchema } from '../../../../../shared/recruitment/schemas'

/**
 * Saves a vacancy's screening configuration: bucket weights, criteria, banded
 * scoring, keyword sets, auto-disqualification rules, document slots and panel.
 *
 * Written in one interactive transaction. A half-saved scheme is worse than a
 * rejected save: applications would score against criteria that no longer match
 * the weights, and the totals would look plausible while being wrong.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Vacancy id is required' })

    const scheme = vacancySchemeSchema.parse(await readBody(event))

    const existing = await prisma.job.findUnique({
      where: { id },
      select: { id: true, scoringVersion: true, _count: { select: { applications: true } } }
    })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

    // Changing criteria under applications that have already been scored would
    // leave those scores referencing criteria that no longer exist. Each
    // application keeps its own schemeSnapshot, so history survives, but the
    // live totals must be recomputed deliberately rather than drifting.
    const rescoreRequired = existing._count.applications > 0

    await prisma.$transaction(
      async (tx: any) => {
        await tx.job.update({
          where: { id },
          data: {
            bucketWeights: scheme.bucketWeights ?? undefined,
            keywords: scheme.keywords ?? undefined,
            jobDescriptionText: scheme.jobDescriptionText ?? undefined,
            minYearsExperience: scheme.minYearsExperience ?? undefined,
            maxNoticePeriodDays: scheme.maxNoticePeriodDays ?? undefined,
            panelAggregation: scheme.panelAggregation ?? undefined,
            panelSpreadThreshold: scheme.panelSpreadThreshold ?? undefined,
            panelBlindIdentity: scheme.panelBlindIdentity ?? undefined,
            panelBlindDemographics: scheme.panelBlindDemographics ?? undefined,
            autoRejectEnabled: scheme.autoRejectEnabled ?? undefined,
            autoRejectDelayMinutes: scheme.autoRejectDelayMinutes ?? undefined,
            // Bumped so a score records which revision of the scheme produced it.
            scoringVersion: { increment: 1 },
            updatedBy: session.user.id
          }
        })

        // Children are replaced wholesale — the same delete-then-create shape the
        // tenders module uses — because the builder edits them as a whole list.
        if (scheme.criteria) {
          await tx.vacancyCriterion.deleteMany({ where: { jobId: id } })
          if (scheme.criteria.length) {
            await tx.vacancyCriterion.createMany({
              data: scheme.criteria.map((c) => ({
                jobId: id,
                key: c.key,
                label: c.label,
                description: c.description ?? null,
                bucket: c.bucket,
                type: c.type,
                weight: c.weight,
                maxPoints: c.maxPoints,
                config: c.config as any,
                sourceField: c.sourceField ?? null,
                isAutoScored: c.isAutoScored,
                isPanelScored: c.isPanelScored,
                isRequired: c.isRequired ?? false,
                showToCandidate: c.showToCandidate,
                sortOrder: c.sortOrder
              }))
            })
          }
        }

        if (scheme.disqualifiers) {
          await tx.vacancyDisqualifier.deleteMany({ where: { jobId: id } })
          if (scheme.disqualifiers.length) {
            await tx.vacancyDisqualifier.createMany({
              data: scheme.disqualifiers.map((d) => ({
                jobId: id,
                key: d.key,
                label: d.label,
                type: d.type,
                sourceField: d.sourceField ?? null,
                config: d.config as any,
                action: d.action,
                severity: d.severity,
                publicReason: d.publicReason ?? null,
                internalReason: d.internalReason ?? null,
                isActive: d.isActive,
                sortOrder: d.sortOrder
              }))
            })
          }
        }

        if (scheme.documentSlots) {
          await tx.vacancyDocumentSlot.deleteMany({ where: { jobId: id } })
          if (scheme.documentSlots.length) {
            await tx.vacancyDocumentSlot.createMany({
              data: scheme.documentSlots.map((s) => ({
                jobId: id,
                key: s.key,
                label: s.label,
                description: s.description ?? null,
                isMandatory: s.isMandatory,
                allowMultiple: s.allowMultiple,
                maxFiles: s.maxFiles,
                allowedExtensions: s.allowedExtensions as any,
                maxSizeBytes: s.maxSizeBytes,
                sortOrder: s.sortOrder
              }))
            })
          }
        }

        if (scheme.panelMembers) {
          await tx.vacancyPanelMember.deleteMany({ where: { jobId: id } })
          if (scheme.panelMembers.length) {
            await tx.vacancyPanelMember.createMany({
              data: scheme.panelMembers.map((m) => ({
                jobId: id,
                userId: m.userId,
                role: m.role,
                canSeeIdentity: m.canSeeIdentity,
                canSeeDemographics: m.canSeeDemographics,
                canSeeOtherScores: m.canSeeOtherScores,
                assignedBy: session.user.id
              }))
            })
          }
        }

        await tx.recruitmentAuditLog.create({
          data: {
            action: 'vacancy.scheme_updated',
            entityType: 'Job',
            entityId: id,
            jobId: id,
            actorId: session.user.id,
            actorName: session.user.name ?? session.user.email,
            actorRole: session.user.role,
            summary: `Updated screening scheme (v${existing.scoringVersion + 1})`,
            detail: {
              criteria: scheme.criteria?.length ?? null,
              disqualifiers: scheme.disqualifiers?.length ?? null,
              documentSlots: scheme.documentSlots?.length ?? null,
              panelMembers: scheme.panelMembers?.length ?? null,
              rescoreRequired
            } as any
          }
        })
      },
      // Several createMany calls on a large scheme can exceed the 5s default.
      { timeout: 20_000, maxWait: 5_000 }
    )

    return {
      success: true,
      scoringVersion: existing.scoringVersion + 1,
      rescoreRequired,
      message: rescoreRequired
        ? `Scheme saved. ${existing._count.applications} existing application(s) still hold scores from the previous version — rescore them from the applications console.`
        : 'Screening scheme saved.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      const first = error.issues[0]
      throw createError({
        statusCode: 400,
        statusMessage: first ? `${first.path.join('.')}: ${first.message}` : 'Validation error',
        data: { issues: error.issues }
      })
    }
    console.error('[recruitment/vacancies] scheme save failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save screening scheme' })
  }
})
