import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { consumeCandidateToken, createCandidateSession } from '../../../utils/candidateAuth'

const bodySchema = z.object({ token: z.string().min(10) })

export default defineEventHandler(async (event) => {
  try {
    const { token } = bodySchema.parse(await readBody(event))
    const consumed = await consumeCandidateToken(token, 'EMAIL_VERIFY')

    if (!consumed) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This confirmation link is invalid or has expired. Request a new one by signing in.'
      })
    }

    await prisma.candidate.update({
      where: { id: consumed.candidateId },
      data: { emailVerifiedAt: new Date() }
    })

    // Sign them in straight away — they have just proved they own the address,
    // and asking for a password immediately afterwards achieves nothing.
    await createCandidateSession(event, consumed.candidateId)

    return { success: true, message: 'Email confirmed. You are now signed in.' }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid confirmation link' })
    }
    console.error('[candidates] verify failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not confirm your email' })
  }
})
