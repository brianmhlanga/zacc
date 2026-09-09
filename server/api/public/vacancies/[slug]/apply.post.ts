import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { requireCandidate } from '../../../../utils/candidateAuth'
import { scoreAndPersist } from '../../../../utils/recruitmentScoring'
import { enqueueNotification, buildApplicationVariables, NOTIFICATION_KEYS } from '../../../../utils/notifications'
import { highestQualification } from '../../../../../shared/recruitment/qualifications'
import { declarationQuestion, isAdverseDeclaration } from '../../../../../shared/recruitment/declarations'
import { backfillProfileFromApplication } from '../../../../utils/profileBackfill'

/**
 * Submits a structured application.
 *
 * The whole write is one interactive transaction: the application row, seven
 * child tables, the draft deletion and the vacancy counter. A partial submit
 * would leave a candidate with a reference number and no employment history, or
 * a counter that disagrees with the rows — both worse than a clean failure.
 *
 * Scoring runs *after* the transaction commits. It reads back what was written
 * and writes its own rows, and nesting it would hold locks across the whole
 * scoring pass for no benefit.
 */
const answersSchema = z.object({
  personal: z.record(z.string(), z.unknown()),
  position: z.record(z.string(), z.unknown()),
  qualifications: z.array(z.record(z.string(), z.unknown())).default([]),
  memberships: z.array(z.record(z.string(), z.unknown())).default([]),
  employment: z.object({
    totalYears: z.number().nullish(),
    isCurrentlyEmployed: z.boolean().nullish(),
    positions: z.array(z.record(z.string(), z.unknown())).default([])
  }),
  declarations: z.record(z.string(), z.object({
    answer: z.boolean(),
    explanation: z.string().nullish(),
    documentId: z.string().nullish()
  })),
  skills: z.object({ raw: z.string().default(''), list: z.array(z.string()).default([]) }),
  languages: z.array(z.record(z.string(), z.unknown())).default([]),
  documents: z.array(z.object({
    slotKey: z.string(),
    fileName: z.string(),
    fileUrl: z.string(),
    fileSize: z.number(),
    fileType: z.string().optional(),
    label: z.string().nullish(),
    candidateDocumentId: z.string().nullish()
  })).default([])
})

const bodySchema = z.object({
  answers: answersSchema,
  confirmed: z.literal(true, { message: 'Please confirm the declaration before submitting' })
})

/** `ZACC-APP-<year>-<8 digits>`, matching the corruption-report convention. */
function buildReference(prefix: string): string {
  const year = new Date().getFullYear()
  const random = String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')
  return `${prefix}-${year}-${random}`
}

/**
 * Reserves a unique reference BEFORE the transaction opens.
 *
 * A P2002 retry *inside* an interactive transaction aborts the whole
 * transaction, so the corruption-report pattern of retrying in place does not
 * transfer. Checking first leaves a theoretical race, which the unique index
 * still catches and the outer retry handles.
 */
async function reserveReference(prefix: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = buildReference(prefix)
    const clash = await prisma.jobApplication.findUnique({
      where: { referenceNumber: candidate },
      select: { id: true }
    })
    if (!clash) return candidate
  }
  throw createError({ statusCode: 500, statusMessage: 'Could not allocate a reference number' })
}

export default defineEventHandler(async (event) => {
  try {
    const candidate = await requireCandidate(event)
    const slug = getRouterParam(event, 'slug')

    markVariesBySession(event)

    // requireOpen: false keeps the explicit 410 below.
    const job = await prisma.job.findFirst({
      where: publicVacancyWhere({
        staffViewer: await isStaffViewer(event),
        requireOpen: false,
        identity: { kind: 'idOrSlug', value: String(slug) }
      }),
      select: {
        id: true, title: true, department: true, grade: true, closingDate: true,
        referencePrefix: true, applicationMode: true, isTestMode: true,
        documentSlots: { select: { key: true, label: true, isMandatory: true } }
      }
    })
    if (!job) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
    if (new Date(job.closingDate) < new Date()) {
      throw createError({ statusCode: 410, statusMessage: 'This vacancy has closed' })
    }

    const duplicate = await prisma.jobApplication.findFirst({
      where: { jobId: job.id, candidateId: candidate.id, isWithdrawn: false },
      select: { referenceNumber: true }
    })
    if (duplicate) {
      throw createError({
        statusCode: 409,
        statusMessage: `You have already applied for this post (${duplicate.referenceNumber}).`
      })
    }

    const { answers } = bodySchema.parse(await readBody(event))

    // Mandatory documents are checked here as well as in the browser: the
    // wizard's checks are UX, this is the gate.
    const provided = new Set(answers.documents.map((d) => d.slotKey))
    const missing = job.documentSlots.filter((s) => s.isMandatory && !provided.has(s.key))
    if (missing.length) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required document(s): ${missing.map((m) => m.label).join(', ')}`
      })
    }

    const defaultStage = await prisma.recruitmentStage.findFirst({
      where: { isDefault: true, isActive: true },
      select: { id: true, key: true, legacyStatus: true, internalLabel: true, publicLabel: true, publicDescription: true }
    })

    const reference = await reserveReference(job.referencePrefix || 'ZACC-APP')

    const levels = answers.qualifications
      .map((q: any) => q.level)
      .filter(Boolean) as any[]
    const highest = highestQualification(levels)

    const p: any = answers.personal
    const pos: any = answers.position

    const applicationId = await prisma.$transaction(async (tx: any) => {
      const created = await tx.jobApplication.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          referenceNumber: reference,
          mode: 'STRUCTURED',
          // Snapshot of the vacancy's test flag, so this application still says
          // "rehearsal" if the switch is turned off afterwards.
          wasTestModeAtSubmit: job.isTestMode,
          stageId: defaultStage?.id ?? null,
          status: defaultStage?.legacyStatus ?? 'PENDING',
          submittedAt: new Date(),

          // Legacy columns kept populated so the original admin screen and any
          // existing query still work against structured applications.
          name: `${candidate.firstName} ${candidate.lastName}`.trim(),
          email: candidate.email,
          phone: String(p.phone ?? p.phone1 ?? ''),

          answers: answers as any,

          firstName: candidate.firstName,
          lastName: candidate.lastName,
          nationalIdType: p.nationalIdType ?? null,
          nationalId: p.nationalId ?? null,
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
          gender: p.gender ?? null,
          nationality: p.nationality ?? null,
          hasDisability: typeof p.hasDisability === 'boolean' ? p.hasDisability : null,
          province: p.province ?? null,
          city: p.city ?? null,
          altPhone: p.altPhone ?? null,
          howHeard: pos.howHeard ?? null,
          noticePeriodDays: pos.noticePeriodDays ?? null,
          willingToRelocate: typeof pos.willingToRelocate === 'boolean' ? pos.willingToRelocate : null,
          expectedSalary: pos.expectedSalary ?? null,
          totalYearsExperience: answers.employment.totalYears ?? null,
          isCurrentlyEmployed: answers.employment.isCurrentlyEmployed ?? null,
          highestQualification: highest ?? null,

          qualifications: answers.qualifications.length
            ? {
                create: answers.qualifications.map((q: any) => ({
                  level: q.level,
                  fieldOfStudy: q.fieldOfStudy ?? null,
                  institution: q.institution ?? null,
                  country: q.country ?? null,
                  yearObtained: q.yearObtained ? Number(q.yearObtained) : null,
                  classGrade: q.classGrade ?? null,
                  result: q.result ?? null
                }))
              }
            : undefined,

          employments: answers.employment.positions.length
            ? {
                create: answers.employment.positions.map((e: any, i: number) => ({
                  sortOrder: i,
                  employer: String(e.employer ?? ''),
                  jobTitle: String(e.jobTitle ?? ''),
                  fromMonth: e.fromMonth ?? null,
                  toMonth: e.toMonth ?? null,
                  isCurrent: Boolean(e.isCurrent),
                  salary: e.salary ?? null,
                  responsibilities: e.responsibilities ?? null,
                  reasonForLeaving: e.reasonForLeaving ?? null,
                  noticePeriod: e.noticePeriod ?? null,
                  supervisorName: e.supervisorName ?? null,
                  supervisorRole: e.supervisorRole ?? null,
                  supervisorPhone: e.supervisorPhone ?? null
                }))
              }
            : undefined,

          declarations: Object.keys(answers.declarations).length
            ? {
                create: Object.entries(answers.declarations).map(([key, d]) => ({
                  key,
                  question: declarationQuestion(key),
                  answer: d.answer,
                  explanation: d.explanation ?? null,
                  documentId: d.documentId ?? null,
                  isAdverse: isAdverseDeclaration(key, d.answer)
                }))
              }
            : undefined,

          skills: answers.skills.list.length
            ? { create: answers.skills.list.map((name) => ({ kind: 'software', name })) }
            : undefined,

          documents: answers.documents.length
            ? {
                create: answers.documents.map((d) => ({
                  slotKey: d.slotKey,
                  fileName: d.fileName,
                  fileUrl: d.fileUrl,
                  fileSize: d.fileSize,
                  fileType: d.fileType ?? d.fileName.split('.').pop() ?? 'bin',
                  label: d.label ?? null,
                  candidateDocumentId: d.candidateDocumentId ?? null
                }))
              }
            : undefined,

          stageEvents: defaultStage
            ? {
                create: {
                  stageId: defaultStage.id,
                  toStageKey: defaultStage.key,
                  toInternalLabel: defaultStage.internalLabel,
                  toPublicLabel: defaultStage.publicLabel,
                  isAutomated: true,
                  note: 'Application submitted'
                }
              }
            : undefined
        },
        select: { id: true }
      })

      // Languages are a separate shape from the free-text skills list.
      if (answers.languages.length) {
        await tx.applicationSkill.createMany({
          data: answers.languages.map((l: any) => ({
            applicationId: created.id,
            kind: 'language',
            name: String(l.language ?? ''),
            detail: l as any
          }))
        })
      }

      await tx.job.update({
        where: { id: job.id },
        data: { applicationCount: { increment: 1 } }
      })

      // The draft has served its purpose; leaving it would show the candidate a
      // resumable application they have already submitted.
      await tx.applicationDraft.deleteMany({
        where: { candidateId: candidate.id, jobId: job.id }
      })

      return created.id
    }, { timeout: 30_000, maxWait: 10_000 })

    // The profile learns from the application, so the second post this
    // candidate applies for is mostly filled in already. Only ever *fills gaps*
    // — never overwrites something the candidate curated on the profile page,
    // because an answer tailored to one vacancy is not necessarily what they
    // want carried forward to the next.
    await backfillProfileFromApplication(candidate.id, answers).catch((e) =>
      // A profile that failed to learn is a small loss; a submitted application
      // that failed to save is a large one. Never let this take the submit down.
      console.error('[public/vacancies] profile backfill failed', e)
    )

    // Scoring and notification are outside the transaction on purpose — see the
    // note at the top of this file.
    let scored: any = null
    try {
      scored = await scoreAndPersist(applicationId)
    } catch (e) {
      // A scoring failure must not lose the application. It is recoverable from
      // the console; a rejected submit is not.
      console.error('[public/vacancies] scoring failed after submit', e)
    }

    await enqueueNotification({
      templateKey: NOTIFICATION_KEYS.APPLICATION_RECEIVED,
      to: { email: candidate.email, name: candidate.firstName },
      variables: buildApplicationVariables({
        application: {
          referenceNumber: reference,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          submittedAt: new Date(),
          finalScore: null
        },
        job: job as any,
        stage: defaultStage as any
      }),
      contextType: 'application',
      contextId: applicationId,
      // An acknowledgement should be immediate — the candidate is waiting for it.
      delayMinutes: 0,
      respectSendWindow: false
    }).catch((e) => console.error('[public/vacancies] acknowledgement failed', e))

    return {
      success: true,
      id: applicationId,
      reference,
      autoRejected: scored?.autoRejected ?? false,
      message: 'Your application has been submitted. Keep your reference number to track progress.'
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
    console.error('[public/vacancies] apply failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not submit your application' })
  }
})
