import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import {
  consumeCandidateToken, hashCandidatePassword, revokeAllCandidateSessions
} from '../../../utils/candidateAuth'

const bodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(10, 'Use at least 10 characters')
})

export default defineEventHandler(async (event) => {
  try {
    const { token, password } = bodySchema.parse(await readBody(event))
    const consumed = await consumeCandidateToken(token, 'PASSWORD_RESET')

    if (!consumed) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This reset link is invalid or has expired. Request a new one.'
      })
    }

    await prisma.candidate.update({
      where: { id: consumed.candidateId },
      data: {
        passwordHash: await hashCandidatePassword(password),
        // A reset is also the recovery path after a compromise, so clear the
        // lockout rather than leaving the real owner locked out.
        failedLoginCount: 0,
        lockedUntil: null
      }
    })

    // Anyone signed in with the old password is signed out.
    await revokeAllCandidateSessions(consumed.candidateId)

    return { success: true, message: 'Password changed. Please sign in.' }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[candidates] reset-password failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not reset your password' })
  }
})
