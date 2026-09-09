import { prisma } from '../../../../utils/prisma'
import { getCandidateFromRequest } from '../../../../utils/candidateAuth'

/**
 * Everything the application wizard needs to render and to score locally.
 *
 * The criteria are sent to the browser deliberately: the live scorecard runs the
 * same `scoreApplication` the server runs, so the number a candidate watches is
 * the number that gets recorded. Only criteria flagged `showToCandidate` are
 * included, and disqualifier *internal* reasons never leave the server.
 */
export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, statusMessage: 'Vacancy is required' })

    markVariesBySession(event)

    // requireOpen: false — a closed vacancy must still be found so the wizard
    // can render its "closed" state; the `closed` flag below does that work.
    const job = await prisma.job.findFirst({
      where: publicVacancyWhere({
        staffViewer: await isStaffViewer(event),
        requireOpen: false,
        identity: { kind: 'idOrSlug', value: String(slug) }
      }),
      select: {
        id: true, title: true, slug: true, department: true, location: true,
        grade: true, dutyStation: true, type: true, numberOfPosts: true,
        summary: true, description: true, keyRequirements: true, responsibilities: true,
        benefits: true, closingDate: true, applicationMode: true,
        bucketWeights: true, keywords: true, minYearsExperience: true,
        criteria: {
          where: { showToCandidate: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, key: true, label: true, description: true, bucket: true,
            type: true, weight: true, maxPoints: true, config: true,
            sourceField: true, isAutoScored: true, isPanelScored: true,
            showToCandidate: true, sortOrder: true
          }
        },
        documentSlots: { orderBy: { sortOrder: 'asc' } },
        disqualifiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          // `internalReason` is withheld — the candidate gets publicReason only.
          select: {
            id: true, key: true, label: true, type: true, sourceField: true,
            config: true, action: true, severity: true, publicReason: true, sortOrder: true
          }
        }
      }
    })

    if (!job) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

    const closed = new Date(job.closingDate) < new Date()

    const candidate = await getCandidateFromRequest(event)

    // Has this candidate already applied? The wizard needs to know before it
    // lets them start filling it in again.
    let existingApplication: any = null
    let draft: any = null
    if (candidate) {
      existingApplication = await prisma.jobApplication.findFirst({
        where: { jobId: job.id, candidateId: candidate.id, isWithdrawn: false },
        select: { id: true, referenceNumber: true, submittedAt: true }
      })
      draft = await prisma.applicationDraft.findUnique({
        where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
        select: { answers: true, currentStep: true, version: true, updatedAt: true }
      })
    }

    // The candidate's reusable profile pre-fills the wizard.
    let profile: any = null
    if (candidate) {
      profile = await prisma.candidateProfile.findUnique({
        where: { candidateId: candidate.id }
      })
    }

    return {
      vacancy: {
        ...job,
        closed,
        daysToClose: Math.ceil((new Date(job.closingDate).getTime() - Date.now()) / 86400000)
      },
      criteria: job.criteria,
      documentSlots: job.documentSlots,
      disqualifiers: job.disqualifiers,
      bucketWeights: job.bucketWeights ?? {
        QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10
      },
      keywords: job.keywords ?? { required: [], preferred: [] },
      candidate: candidate
        ? { id: candidate.id, firstName: candidate.firstName, lastName: candidate.lastName, email: candidate.email }
        : null,
      profile,
      draft,
      existingApplication
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[public/vacancies] form-schema failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not load the application form' })
  }
})
