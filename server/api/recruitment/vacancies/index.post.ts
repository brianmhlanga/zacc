import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

/**
 * Creates a vacancy.
 *
 * A new STRUCTURED vacancy is seeded with a sensible starter scheme rather than
 * left empty — an empty scheme scores every applicant zero, and the failure is
 * silent. HR edits it in the builder; the point is that the default is safe.
 */
const bodySchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1),
  grade: z.string().nullish(),
  dutyStation: z.string().nullish(),
  numberOfPosts: z.number().int().min(1).max(100).default(1),
  summary: z.string().min(10, 'Summary is required'),
  description: z.string().min(10, 'Description is required'),
  keyRequirements: z.array(z.string()).min(1, 'Add at least one requirement'),
  responsibilities: z.array(z.string()).min(1, 'Add at least one responsibility'),
  benefits: z.string().nullish(),
  closingDate: z.string().min(1),
  applicationMode: z.enum(['LEGACY', 'STRUCTURED']).default('STRUCTURED'),
  isPublished: z.boolean().default(false),
  isActive: z.boolean().default(true),
  /** Copy criteria from an existing scheme library entry. */
  scoringTemplateId: z.string().nullish()
})

/** The starter scheme: the four buckets each carry at least one criterion. */
const STARTER_CRITERIA = [
  {
    key: 'years_experience', label: 'Years of relevant experience',
    bucket: 'QUALIFICATIONS_EXPERIENCE', type: 'BANDED', weight: 1, maxPoints: 100,
    sourceField: 'employment.totalYears', isAutoScored: true, isPanelScored: false,
    showToCandidate: true, sortOrder: 1,
    config: {
      kind: 'BANDED', unit: 'years',
      bands: [
        { label: 'Under 3 years', min: 0, max: 2, points: 20 },
        { label: '3-4 years', min: 3, max: 4, points: 50 },
        { label: '5-10 years', min: 5, max: 10, points: 80 },
        { label: 'Over 10 years', min: 11, max: null, points: 100 }
      ]
    }
  },
  {
    key: 'qualification', label: 'Highest qualification',
    bucket: 'QUALIFICATIONS_EXPERIENCE', type: 'QUALIFICATION_LADDER', weight: 1, maxPoints: 100,
    sourceField: null, isAutoScored: true, isPanelScored: false, showToCandidate: true, sortOrder: 2,
    config: {
      kind: 'QUALIFICATION_LADDER',
      ladder: [
        { level: 'DOCTORATE', points: 100 }, { level: 'MASTERS', points: 90 },
        { level: 'POSTGRAD_DIPLOMA', points: 78 }, { level: 'FIRST_DEGREE', points: 72 },
        { level: 'HIGHER_DIPLOMA', points: 60 }, { level: 'DIPLOMA', points: 50 },
        { level: 'CERTIFICATE', points: 35 }, { level: 'A_LEVEL', points: 25 },
        { level: 'O_LEVEL', points: 15 }, { level: 'GRADE_7', points: 8 }
      ]
    }
  },
  {
    key: 'skills_match', label: 'Skills and keyword match',
    bucket: 'SKILLS', type: 'KEYWORD', weight: 1, maxPoints: 100,
    sourceField: null, isAutoScored: true, isPanelScored: false, showToCandidate: true, sortOrder: 3,
    config: { kind: 'KEYWORD', required: [], preferred: [] }
  },
  {
    key: 'vetting_consent', label: 'Consents to vetting and asset declaration',
    bucket: 'INTEGRITY', type: 'BOOLEAN', weight: 1, maxPoints: 100,
    sourceField: 'declarations.vetting.answer', isAutoScored: true, isPanelScored: false,
    showToCandidate: true, sortOrder: 4,
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  },
  {
    key: 'notice_period', label: 'Availability',
    bucket: 'FIT', type: 'BANDED', weight: 1, maxPoints: 100,
    sourceField: 'position.noticePeriodDays', isAutoScored: true, isPanelScored: false,
    showToCandidate: true, sortOrder: 5,
    config: {
      kind: 'BANDED', unit: 'days',
      bands: [
        { label: 'Immediately', min: 0, max: 0, points: 100 },
        { label: 'Within a month', min: 1, max: 30, points: 75 },
        { label: 'One to two months', min: 31, max: 60, points: 50 },
        { label: 'Over two months', min: 61, max: null, points: 25 }
      ]
    }
  }
]

const STARTER_DISQUALIFIERS = [
  {
    key: 'corruption_investigation', label: 'Under corruption or fraud investigation',
    type: 'REQUIRED_FALSE', sourceField: 'declarations.corruption.answer',
    config: {}, action: 'AUTO_REJECT', severity: 'CRITICAL',
    publicReason: 'Your application could not be progressed at this time.',
    internalReason: 'Adverse corruption declaration — policy bars progression while a matter is open.',
    isActive: true, sortOrder: 1
  },
  {
    key: 'refuses_vetting', label: 'Unwilling to undergo vetting',
    type: 'REQUIRED_TRUE', sourceField: 'declarations.vetting.answer',
    config: {}, action: 'AUTO_REJECT', severity: 'CRITICAL',
    publicReason: 'Vetting is a condition of employment at the Commission.',
    internalReason: 'Declined vetting and asset declaration.',
    isActive: true, sortOrder: 2
  }
]

const STARTER_SLOTS = [
  { key: 'cv', label: 'CV / Résumé', isMandatory: true, allowMultiple: false, maxFiles: 1, allowedExtensions: ['pdf', 'doc', 'docx'], maxSizeBytes: 5242880, sortOrder: 1 },
  { key: 'certificates', label: 'Certified academic certificates', isMandatory: true, allowMultiple: true, maxFiles: 10, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 15728640, sortOrder: 2 },
  { key: 'national_id', label: 'Certified copy of national ID', isMandatory: false, allowMultiple: false, maxFiles: 1, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 5242880, sortOrder: 3 },
  { key: 'reference_1', label: 'Reference letter', isMandatory: false, allowMultiple: true, maxFiles: 3, allowedExtensions: ['pdf'], maxSizeBytes: 5242880, sortOrder: 4 }
]

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const data = bodySchema.parse(await readBody(event))

    const clash = await prisma.job.findUnique({ where: { slug: data.slug }, select: { id: true } })
    if (clash) throw createError({ statusCode: 400, statusMessage: 'That slug is already in use' })

    const structured = data.applicationMode === 'STRUCTURED'

    // A template, when chosen, is COPIED. Editing the library entry later must
    // never alter a vacancy that has already scored applicants against it.
    let criteria = structured ? STARTER_CRITERIA : []
    let disqualifiers = structured ? STARTER_DISQUALIFIERS : []
    let slots = structured ? STARTER_SLOTS : []

    if (data.scoringTemplateId) {
      const template = await prisma.scoringTemplate.findUnique({
        where: { id: data.scoringTemplateId },
        select: { definition: true }
      })
      const def: any = template?.definition
      if (def) {
        criteria = def.criteria ?? criteria
        disqualifiers = def.disqualifiers ?? disqualifiers
        slots = def.documentSlots ?? slots
      }
    }

    const job = await prisma.job.create({
      data: {
        title: data.title,
        slug: data.slug,
        department: data.department,
        location: data.location,
        type: data.type,
        grade: data.grade ?? null,
        dutyStation: data.dutyStation ?? null,
        numberOfPosts: data.numberOfPosts,
        summary: data.summary,
        description: data.description,
        keyRequirements: data.keyRequirements as any,
        responsibilities: data.responsibilities as any,
        benefits: data.benefits ?? null,
        closingDate: new Date(data.closingDate),
        applicationMode: data.applicationMode,
        isPublished: data.isPublished,
        isActive: data.isActive,
        publishedAt: data.isPublished ? new Date() : null,
        scoringTemplateId: data.scoringTemplateId ?? null,
        bucketWeights: structured
          ? { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10 }
          : undefined,
        keywords: structured ? { required: [], preferred: [] } : undefined,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        criteria: criteria.length ? { create: criteria as any } : undefined,
        disqualifiers: disqualifiers.length ? { create: disqualifiers as any } : undefined,
        documentSlots: slots.length ? { create: slots as any } : undefined
      },
      select: { id: true, title: true }
    })

    return {
      success: true,
      id: job.id,
      message: structured
        ? 'Vacancy created with a starter screening scheme. Review it before publishing.'
        : 'Vacancy created.'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[recruitment/vacancies] create failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create vacancy' })
  }
})
