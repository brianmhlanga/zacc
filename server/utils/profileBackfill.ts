import { prisma } from './prisma'
import { profileCompletion } from '../../shared/recruitment/profileCompletion'

/**
 * Teaches the candidate's reusable profile from an application they just sent.
 *
 * The point is that applying twice should be much less work than applying once.
 * A candidate who never opens the profile page still ends up with one, built
 * from what they have already typed.
 *
 * **Gap-filling only.** An empty section is populated; a section the candidate
 * has already curated is left exactly as it is. An answer shaped for one
 * vacancy — a trimmed employment list, a skill set narrowed to that post — is
 * not necessarily what they want carried forward, and silently rewriting a
 * profile from the last thing submitted would be a surprising thing to do to
 * someone's own record.
 */
export async function backfillProfileFromApplication(
  candidateId: string,
  answers: any
): Promise<void> {
  const existing = await prisma.candidateProfile.findUnique({ where: { candidateId } })

  const personal = answers?.personal ?? {}
  const isEmpty = (v: unknown) => !Array.isArray(v) || v.length === 0

  const next: Record<string, any> = {}
  const keep = (field: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return
    // `existing` may be null on a first application; then everything is a gap.
    if (existing && (existing as any)[field]) return
    next[field] = value
  }

  keep('middleName', personal.middleName)
  keep('placeOfBirth', personal.placeOfBirth)
  keep('nationalIdType', personal.nationalIdType)
  keep('nationalId', personal.nationalId)
  keep('nationality', personal.nationality)
  keep('gender', personal.gender)
  keep('currentAddress', personal.currentAddress)
  keep('permanentAddress', personal.permanentAddress)
  keep('province', personal.province)
  keep('city', personal.city)
  keep('altPhone', personal.altPhone)
  keep('driversLicenceClass', personal.driversLicenceClass)

  if (personal.dateOfBirth && !existing?.dateOfBirth) {
    next.dateOfBirth = new Date(personal.dateOfBirth)
  }
  // A boolean false is a real answer, so `keep`'s truthiness test cannot be used.
  if (typeof personal.hasDisability === 'boolean' && existing?.hasDisability == null) {
    next.hasDisability = personal.hasDisability
    if (personal.disabilityDetail) next.disabilityDetail = personal.disabilityDetail
  }

  if (isEmpty(existing?.qualifications) && answers?.qualifications?.length) {
    next.qualifications = answers.qualifications
  }
  if (isEmpty(existing?.memberships) && answers?.memberships?.length) {
    next.memberships = answers.memberships
  }
  if (isEmpty(existing?.employment) && answers?.employment?.positions?.length) {
    next.employment = answers.employment.positions
  }
  if (isEmpty(existing?.skills) && answers?.skills?.list?.length) {
    next.skills = answers.skills.list
  }
  if (isEmpty(existing?.languages) && answers?.languages?.length) {
    next.languages = answers.languages
  }

  if (!existing && !Object.keys(next).length) return
  if (existing && !Object.keys(next).length) return

  const merged = { ...(existing ?? {}), ...next }
  next.completionPct = profileCompletion(merged as any)

  await prisma.candidateProfile.upsert({
    where: { candidateId },
    update: next,
    create: { candidateId, ...next }
  })
}
