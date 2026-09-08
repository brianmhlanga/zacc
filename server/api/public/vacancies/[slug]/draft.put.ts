import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { requireCandidate } from '../../../../utils/candidateAuth'

/**
 * Autosaves the wizard.
 *
 * Server-side rather than localStorage only, so a candidate who fills in six
 * steps at an internet café and comes back on a phone does not start again.
 * `version` is a conflict guard for the same account open in two tabs.
 */
const bodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  currentStep: z.number().int().min(1).max(12).default(1),
  version: z.number().int().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const candidate = await requireCandidate(event)
    const slug = getRouterParam(event, 'slug')

    const job = await prisma.job.findFirst({
      where: { OR: [{ slug }, { id: slug }], isPublished: true, isActive: true },
      select: { id: true, closingDate: true }
    })
    if (!job) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
    if (new Date(job.closingDate) < new Date()) {
      throw createError({ statusCode: 410, statusMessage: 'This vacancy has closed' })
    }

    const body = bodySchema.parse(await readBody(event))

    const existing = await prisma.applicationDraft.findUnique({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
      select: { version: true }
    })

    // A stale version means another tab saved after this one loaded. Rejecting
    // is better than silently overwriting the newer answers.
    if (existing && body.version !== undefined && body.version < existing.version) {
      throw createError({
        statusCode: 409,
        statusMessage: 'This application was updated in another tab. Reload to continue.'
      })
    }

    const draft = await prisma.applicationDraft.upsert({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
      update: {
        answers: body.answers as any,
        currentStep: body.currentStep,
        version: { increment: 1 }
      },
      create: {
        candidateId: candidate.id,
        jobId: job.id,
        answers: body.answers as any,
        currentStep: body.currentStep,
        version: 1
      },
      select: { version: true, updatedAt: true }
    })

    return { success: true, version: draft.version, savedAt: draft.updatedAt }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Could not save the draft' })
    }
    console.error('[public/vacancies] draft save failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not save your progress' })
  }
})
