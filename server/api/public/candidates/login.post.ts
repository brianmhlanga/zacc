import { z } from 'zod'
import { createCandidateSession, verifyCandidateLogin } from '../../../utils/candidateAuth'
import { getCandidateFromRequest } from '../../../utils/candidateAuth'

const bodySchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password')
})

export default defineEventHandler(async (event) => {
  try {
    const { email, password } = bodySchema.parse(await readBody(event))
    const result = await verifyCandidateLogin(email, password)

    if (!result.ok) {
      if (result.reason === 'LOCKED') {
        const mins = result.lockedUntil
          ? Math.max(1, Math.ceil((result.lockedUntil.getTime() - Date.now()) / 60_000))
          : 15
        throw createError({
          statusCode: 429,
          statusMessage: `Too many failed attempts. Try again in ${mins} minute(s).`
        })
      }
      if (result.reason === 'INACTIVE') {
        throw createError({ statusCode: 403, statusMessage: 'This account has been deactivated.' })
      }
      // One message for both a wrong password and an unknown address.
      throw createError({ statusCode: 401, statusMessage: 'Email or password is incorrect.' })
    }

    await createCandidateSession(event, result.candidateId!)
    const candidate = await getCandidateFromRequest(event)

    return {
      success: true,
      candidate,
      emailVerified: Boolean(candidate?.emailVerifiedAt)
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[candidates] login failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not sign you in' })
  }
})
