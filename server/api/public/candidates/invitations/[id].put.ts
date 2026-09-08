import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { requireCandidate } from '../../../../utils/candidateAuth'

const bodySchema = z.object({
  response: z.enum(['CONFIRMED', 'DECLINED', 'RESCHEDULE_REQUESTED']),
  note: z.string().max(1000).optional()
})

/** Records a candidate's response to an interview invitation. */
export default defineEventHandler(async (event) => {
  const candidate = await requireCandidate(event)
  const id = getRouterParam(event, 'id')
  const { response, note } = bodySchema.parse(await readBody(event))

  // Ownership is checked through the application, not the invitation id alone.
  const invitation = await prisma.interviewInvitation.findFirst({
    where: { id, application: { candidateId: candidate.id } },
    select: { id: true, applicationId: true, application: { select: { jobId: true } } }
  })
  if (!invitation) throw createError({ statusCode: 404, statusMessage: 'Invitation not found' })

  await prisma.interviewInvitation.update({
    where: { id: invitation.id },
    data: { response, responseNote: note ?? null, respondedAt: new Date() }
  })

  await prisma.recruitmentAuditLog.create({
    data: {
      action: 'interview.response',
      entityType: 'InterviewInvitation',
      entityId: invitation.id,
      jobId: invitation.application.jobId,
      actorName: 'Candidate',
      summary: `Candidate responded: ${response}`
    }
  })

  return { success: true }
})
