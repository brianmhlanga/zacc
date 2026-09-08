import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

/**
 * Saves the pipeline stage configuration: the internal -> candidate label
 * mapping, which stages notify, and how long a notice is held back.
 *
 * System stages can be re-labelled and re-timed but not deleted, since
 * applications reference them and the scoring engine looks some up by key.
 */
const stageSchema = z.object({
  id: z.string().min(1),
  internalLabel: z.string().min(1, 'Internal label is required'),
  publicLabel: z.string().min(1, 'Candidate-facing label is required'),
  internalDescription: z.string().nullish(),
  publicDescription: z.string().nullish(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().int(),
  showOnCandidateTimeline: z.boolean(),
  notifyCandidate: z.boolean(),
  notificationTemplateId: z.string().nullish(),
  notificationDelayMinutes: z.number().int().min(0).max(43200),
  notificationDelayJitterMinutes: z.number().int().min(0).max(10080),
  respectSendWindow: z.boolean(),
  isActive: z.boolean()
}).superRefine((s, ctx) => {
  if (s.notifyCandidate && !s.notificationTemplateId) {
    ctx.addIssue({
      code: 'custom', path: ['notificationTemplateId'],
      message: `"${s.internalLabel}" notifies the candidate but has no template selected`
    })
  }
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const { stages } = z.object({ stages: z.array(stageSchema).min(1) }).parse(await readBody(event))

    await prisma.$transaction(async (tx: any) => {
      for (const s of stages) {
        await tx.recruitmentStage.update({
          where: { id: s.id },
          data: {
            internalLabel: s.internalLabel,
            publicLabel: s.publicLabel,
            internalDescription: s.internalDescription ?? null,
            publicDescription: s.publicDescription ?? null,
            colorHex: s.colorHex ?? undefined,
            sortOrder: s.sortOrder,
            showOnCandidateTimeline: s.showOnCandidateTimeline,
            notifyCandidate: s.notifyCandidate,
            notificationTemplateId: s.notificationTemplateId ?? null,
            notificationDelayMinutes: s.notificationDelayMinutes,
            notificationDelayJitterMinutes: s.notificationDelayJitterMinutes,
            respectSendWindow: s.respectSendWindow,
            isActive: s.isActive
          }
        })
      }

      await tx.recruitmentAuditLog.create({
        data: {
          action: 'config.stages_updated',
          entityType: 'RecruitmentStage',
          actorId: session.user.id,
          actorName: session.user.name ?? session.user.email,
          actorRole: session.user.role,
          summary: `Updated ${stages.length} pipeline stage(s)`
        }
      })
    }, { timeout: 20_000, maxWait: 5_000 })

    return { success: true, message: 'Pipeline settings saved.' }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      const first = error.issues[0]
      throw createError({ statusCode: 400, statusMessage: first?.message || 'Validation error' })
    }
    console.error('[recruitment/config] stages save failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save stages' })
  }
})
