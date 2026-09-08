import { prisma } from '../../../utils/prisma'
import { getCandidateFromRequest } from '../../../utils/candidateAuth'
import { profileCompletion, profileSections } from '../../../../shared/recruitment/profileCompletion'

/** Session probe for the candidate portal. Returns null rather than 401. */
export default defineEventHandler(async (event) => {
  const candidate = await getCandidateFromRequest(event)
  if (!candidate) return { candidate: null }

  // The whole row, because the sidebar shows a tick per section and not just an
  // overall percentage. It is one row on one indexed column.
  const profile = await prisma.candidateProfile.findUnique({
    where: { candidateId: candidate.id }
  })

  const applicationCount = await prisma.jobApplication.count({
    where: { candidateId: candidate.id, isWithdrawn: false }
  })

  const draftCount = await prisma.applicationDraft.count({
    where: { candidateId: candidate.id }
  })

  return {
    candidate: {
      ...candidate,
      emailVerified: Boolean(candidate.emailVerifiedAt),
      // Recomputed rather than read from the stored column, so a row written
      // before a change to the weighting cannot report a stale figure.
      profileCompletion: profileCompletion(profile as any),
      // Only what the nav needs: a key and whether it is done. The profile
      // itself is never sent to a session probe.
      profileSections: profileSections(profile as any).map((s) => ({
        key: s.key,
        complete: s.complete
      })),
      applicationCount,
      draftCount
    }
  }
})
