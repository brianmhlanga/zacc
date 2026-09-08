import { prisma } from '../../../utils/prisma'
import { requireCandidate } from '../../../utils/candidateAuth'
import { profileSections, profileCompletion } from '../../../../shared/recruitment/profileCompletion'

/**
 * The candidate's reusable record.
 *
 * This is the thing that stops someone retyping their whole education and
 * employment history for every post they apply to: the wizard reads it, and a
 * submitted application writes back to it.
 *
 * Returns an empty shape rather than 404 when no row exists yet — a candidate
 * who has never opened the page still has a profile, it is simply blank, and a
 * 404 would make the page handle a case that is not an error.
 */
export default defineEventHandler(async (event) => {
  try {
    const candidate = await requireCandidate(event)

    const profile = await prisma.candidateProfile.findUnique({
      where: { candidateId: candidate.id }
    })

    // Recomputed rather than read back, so a row written before a change to the
    // weighting cannot report a stale figure.
    const completion = profileCompletion(profile as any)

    return {
      candidate: {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone
      },
      profile: profile ?? null,
      completion,
      sections: profileSections(profile as any)
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[candidates/profile] load failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not load your profile' })
  }
})
