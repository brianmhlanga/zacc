import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { hashCandidatePassword, issueCandidateToken } from '../../../utils/candidateAuth'
import { enqueueNotification, NOTIFICATION_KEYS } from '../../../utils/notifications'

const bodySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Surname is required').max(80),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().max(40).optional(),
  password: z.string().min(10, 'Use at least 10 characters'),
  acceptTerms: z.literal(true, { message: 'You must accept the declaration to register' })
})

export default defineEventHandler(async (event) => {
  try {
    const data = bodySchema.parse(await readBody(event))
    const email = data.email.toLowerCase().trim()

    const existing = await prisma.candidate.findUnique({
      where: { email },
      select: { id: true }
    })

    // Deliberately the same response either way. Telling an anonymous caller
    // which addresses already have accounts is a disclosure, and the real owner
    // learns nothing new from a duplicate-registration attempt.
    if (existing) {
      return {
        success: true,
        message: 'Check your email to continue. If an account already exists you can sign in instead.'
      }
    }

    const candidate = await prisma.candidate.create({
      data: {
        email,
        passwordHash: await hashCandidatePassword(data.password),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        profile: { create: {} }
      },
      select: { id: true, email: true, firstName: true }
    })

    const token = await issueCandidateToken(candidate.id, 'EMAIL_VERIFY')
    const origin = getRequestURL(event).origin

    await enqueueNotification({
      templateKey: NOTIFICATION_KEYS.CANDIDATE_VERIFY_EMAIL,
      to: { email: candidate.email, name: candidate.firstName },
      variables: {
        firstName: candidate.firstName,
        verifyUrl: `${origin}/candidate/verify?token=${token}`,
        commission: {
          name: 'Zimbabwe Anti-Corruption Commission',
          shortName: 'ZACC',
          email: process.env.REPORTS_INBOX_EMAIL || 'recruitment@zacc.co.zw',
          siteUrl: process.env.NUXT_PUBLIC_SITE_URL || origin
        }
      },
      contextType: 'candidate',
      contextId: candidate.id,
      // Verification is the one message that must not wait for working hours —
      // the candidate is sitting there having just registered.
      delayMinutes: 0,
      respectSendWindow: false
    })

    return {
      success: true,
      message: 'Check your email to continue. If an account already exists you can sign in instead.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[candidates] register failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not create your account' })
  }
})
