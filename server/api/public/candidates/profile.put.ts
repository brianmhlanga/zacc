import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { requireCandidate } from '../../../utils/candidateAuth'
import { profileSections, profileCompletion } from '../../../../shared/recruitment/profileCompletion'

/**
 * Saves the candidate's reusable record.
 *
 * Deliberately permissive about completeness: a profile is built up over
 * several sittings, so every field is optional and a half-filled save is a
 * normal event, not an error. Validation here is about *shape* — that a year is
 * a number and a qualification level is one we know — not about whether the
 * candidate has finished.
 *
 * The strictness lives where it belongs: an application cannot be submitted
 * incomplete, and that check is in the submit endpoint.
 */
const qualification = z.object({
  level: z.string().min(1),
  fieldOfStudy: z.string().nullish(),
  institution: z.string().nullish(),
  country: z.string().nullish(),
  yearObtained: z.coerce.number().int().min(1940).max(2100).nullish(),
  classGrade: z.string().nullish(),
  result: z.string().nullish()
})

const employment = z.object({
  employer: z.string().nullish(),
  jobTitle: z.string().nullish(),
  fromMonth: z.string().nullish(),
  toMonth: z.string().nullish(),
  isCurrent: z.boolean().optional().default(false),
  responsibilities: z.string().nullish(),
  reasonForLeaving: z.string().nullish(),
  supervisorName: z.string().nullish(),
  supervisorRole: z.string().nullish(),
  supervisorPhone: z.string().nullish()
})

const membership = z.object({
  bodyName: z.string().nullish(),
  status: z.string().nullish(),
  since: z.string().nullish()
})

const language = z.object({
  language: z.string().min(1),
  read: z.string().optional().default('NONE'),
  write: z.string().optional().default('NONE'),
  speak: z.string().optional().default('NONE')
})

const bodySchema = z.object({
  middleName: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  placeOfBirth: z.string().nullish(),
  nationalIdType: z.string().nullish(),
  nationalId: z.string().nullish(),
  nationality: z.string().nullish(),
  gender: z.string().nullish(),
  hasDisability: z.boolean().nullish(),
  disabilityDetail: z.string().nullish(),
  currentAddress: z.string().nullish(),
  permanentAddress: z.string().nullish(),
  province: z.string().nullish(),
  city: z.string().nullish(),
  altPhone: z.string().nullish(),
  phone: z.string().nullish(),

  qualifications: z.array(qualification).max(20).optional(),
  memberships: z.array(membership).max(20).optional(),
  employment: z.array(employment).max(20).optional(),
  skills: z.array(z.string().min(1).max(120)).max(80).optional(),
  languages: z.array(language).max(20).optional(),

  driversLicenceClass: z.string().nullish(),
  driversLicenceExpiry: z.string().nullish()
})

export default defineEventHandler(async (event) => {
  try {
    const candidate = await requireCandidate(event)
    const body = bodySchema.parse(await readBody(event))

    const { phone, dateOfBirth, driversLicenceExpiry, ...rest } = body

    const data: any = {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      driversLicenceExpiry: driversLicenceExpiry ? new Date(driversLicenceExpiry) : null
    }

    // Recomputed from what is being written, so the stored figure can never
    // disagree with the stored record.
    data.completionPct = profileCompletion(data)

    const profile = await prisma.candidateProfile.upsert({
      where: { candidateId: candidate.id },
      update: data,
      create: { candidateId: candidate.id, ...data }
    })

    // The primary phone lives on the account, not the profile — it is what
    // sign-in and notifications use — so it is updated alongside rather than
    // duplicated into a second field that could drift.
    if (phone && phone !== candidate.phone) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { phone }
      })
    }

    return {
      success: true,
      profile,
      completion: profile.completionPct,
      sections: profileSections(profile as any),
      message: 'Profile saved.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      const first = error.issues[0]
      throw createError({
        statusCode: 400,
        statusMessage: first ? `${first.path.join('.')}: ${first.message}` : 'Validation error'
      })
    }
    console.error('[candidates/profile] save failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not save your profile' })
  }
})
