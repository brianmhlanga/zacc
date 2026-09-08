/**
 * End-to-end verification of the recruitment foundation against a real database.
 *
 * Exercises, in order:
 *   1. The `$transaction` repair in server/utils/prisma.ts against the actual
 *      MariaDB adapter — the top risk identified in the implementation plan.
 *   2. The seeded stage catalogue and its internal -> public label mapping.
 *   3. A full vacancy scheme -> application -> score -> persist round trip.
 *   4. The notification outbox, including the configurable rejection delay.
 *
 * Creates its own data and removes it again. Run with:
 *   npx tsx scripts/verify-recruitment.ts
 */
import 'dotenv/config'
import { prisma } from '../server/utils/prisma'
import { scoreAndPersist } from '../server/utils/recruitmentScoring'
import { enqueueNotification, buildApplicationVariables } from '../server/utils/notifications'
import { computeScheduledFor } from '../server/utils/sendWindow'

const TAG = 'VERIFY-' + Date.now()
let failures = 0

function check(label: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}

async function main() {
  console.log('\n=== 1. $transaction against the real MariaDB adapter ===')
  try {
    const txResult = await prisma.$transaction(async (tx: any) => {
      const stage = await tx.recruitmentStage.findFirst({ where: { key: 'received' } })
      const count = await tx.notificationTemplate.count()
      return { stageKey: stage?.key, templates: count }
    })
    check('interactive $transaction returns a value', txResult?.stageKey === 'received',
      `stage=${txResult?.stageKey}, templates=${txResult?.templates}`)
  } catch (e: any) {
    check('interactive $transaction', false, e.message)
  }

  // A transaction must roll back on throw, or a failed submit would leave orphans.
  try {
    const before = await prisma.recruitmentStage.count()
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.recruitmentStage.create({
          data: { key: TAG + '-rollback', internalLabel: 'x', publicLabel: 'x' }
        })
        throw new Error('deliberate rollback')
      })
    } catch { /* expected */ }
    const after = await prisma.recruitmentStage.count()
    check('transaction rolls back on throw', before === after, `${before} -> ${after}`)
  } catch (e: any) {
    check('rollback probe', false, e.message)
  }

  console.log('\n=== 2. Seeded stages and label mapping ===')
  const stages = await prisma.recruitmentStage.findMany({ orderBy: { sortOrder: 'asc' } })
  check('12 stages seeded', stages.length === 12, `found ${stages.length}`)

  const security = stages.find((s: any) => s.key === 'security_checks')
  check('internal label is "Security checks"', security?.internalLabel === 'Security checks')
  check('candidate label is "Under review"', security?.publicLabel === 'Under review',
    'the mapping ZACC asked for')

  const autoReject = stages.find((s: any) => s.isAutoRejectTarget)
  check('auto-reject stage is delayed', (autoReject?.notificationDelayMinutes ?? 0) > 0,
    `${autoReject?.notificationDelayMinutes} min + up to ${autoReject?.notificationDelayJitterMinutes} min jitter`)
  check('auto-reject stage has a template', Boolean(autoReject?.notificationTemplateId))

  console.log('\n=== 3. Vacancy scheme -> application -> score ===')
  const job = await prisma.job.create({
    data: {
      title: TAG + ' Senior Investigations Officer',
      slug: TAG.toLowerCase() + '-sio',
      department: 'investigations',
      location: 'Harare',
      type: 'Full-time',
      summary: 'Verification fixture',
      description: '<p>Verification fixture</p>',
      keyRequirements: ['First Degree'],
      responsibilities: ['Investigate'],
      closingDate: new Date(Date.now() + 30 * 86400000),
      applicationMode: 'STRUCTURED',
      bucketWeights: { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10 },
      keywords: { required: ['fraud', 'asset tracing'], preferred: ['excel'] },
      criteria: {
        create: [
          {
            key: 'years_experience', label: 'Years of relevant experience',
            bucket: 'QUALIFICATIONS_EXPERIENCE', type: 'BANDED', weight: 1, maxPoints: 100,
            sourceField: 'employment.totalYears',
            config: { kind: 'BANDED', unit: 'years', bands: [
              { label: '0-2 years', min: 0, max: 2, points: 20 },
              { label: '3-4 years', min: 3, max: 4, points: 50 },
              { label: '5-10 years', min: 5, max: 10, points: 80 },
              { label: '10+ years', min: 10, max: null, points: 100 }
            ] },
            sortOrder: 1
          },
          {
            key: 'keywords', label: 'Skills match', bucket: 'SKILLS', type: 'KEYWORD',
            weight: 1, maxPoints: 100,
            config: { kind: 'KEYWORD', required: ['fraud', 'asset tracing'], preferred: ['excel'] },
            sortOrder: 2
          },
          {
            key: 'vetting', label: 'Consents to vetting', bucket: 'INTEGRITY', type: 'BOOLEAN',
            weight: 1, maxPoints: 100, sourceField: 'declarations.vetting.answer',
            config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 },
            sortOrder: 3
          },
          {
            key: 'interview', label: 'Interview assessment', bucket: 'FIT', type: 'MANUAL',
            weight: 1, maxPoints: 100, isAutoScored: false, isPanelScored: true,
            config: { kind: 'MANUAL', rubric: [{ label: 'Weak', points: 20 }, { label: 'Strong', points: 80 }] },
            sortOrder: 4
          }
        ]
      },
      disqualifiers: {
        create: [{
          key: 'corruption', label: 'Under corruption investigation',
          type: 'REQUIRED_FALSE', sourceField: 'declarations.corruption.answer',
          config: { detail: 'Adverse corruption declaration' },
          action: 'AUTO_REJECT', severity: 'CRITICAL',
          publicReason: 'Your application could not be progressed at this time.'
        }]
      },
      documentSlots: {
        create: [
          { key: 'cv', label: 'CV', isMandatory: true, allowedExtensions: ['pdf'] },
          { key: 'certificates', label: 'Certificates', isMandatory: true, allowedExtensions: ['pdf'] }
        ]
      }
    },
    select: { id: true }
  })
  check('vacancy with scheme created', Boolean(job.id))

  const receivedStage = stages.find((s: any) => s.isDefault)
  const answers = {
    personal: { dateOfBirth: '1990-01-01', gender: 'Female', province: 'Harare' },
    position: { jobId: job.id, noticePeriodDays: 30, willingToRelocate: true },
    qualifications: [{ level: 'MASTERS', fieldOfStudy: 'Forensic Accounting' }],
    memberships: [],
    employment: {
      totalYears: 6, isCurrentlyEmployed: true,
      positions: [{ employer: 'AGO', jobTitle: 'Investigator', responsibilities: 'fraud and asset tracing work' }]
    },
    declarations: { corruption: { answer: false }, vetting: { answer: true } },
    skills: { raw: 'Excel, ACL', list: ['Excel', 'ACL'] },
    languages: [],
    documents: [{ slotKey: 'cv', fileName: 'cv.pdf' }, { slotKey: 'certificates', fileName: 'certs.pdf' }]
  }

  const application = await prisma.jobApplication.create({
    data: {
      jobId: job.id, name: 'Tariro Chikafu', email: `${TAG.toLowerCase()}@example.com`,
      phone: '+263771234567', mode: 'STRUCTURED',
      referenceNumber: `ZACC-APP-2026-${TAG.slice(-6)}`,
      stageId: receivedStage?.id ?? null,
      status: (receivedStage?.legacyStatus as any) ?? 'PENDING',
      firstName: 'Tariro', lastName: 'Chikafu',
      totalYearsExperience: 6, highestQualification: 'MASTERS',
      gender: 'Female', province: 'Harare',
      submittedAt: new Date(), answers: answers as any
    },
    select: { id: true, referenceNumber: true }
  })
  check('application created with a reference', Boolean(application.referenceNumber),
    application.referenceNumber ?? '')

  const scored = await scoreAndPersist(application.id)
  check('scoreAndPersist returned a result', Boolean(scored))
  if (scored) {
    // 40 (6 yrs -> 80/100 of the 40 bucket = 32) + SKILLS + INTEGRITY 20; FIT pending.
    check('score computed', scored.result.total > 0, `total=${scored.result.total}`)
    check('not auto-rejected on a clean declaration', scored.autoRejected === false)
    check('manual criterion is pending, not zeroed', scored.result.manualPending.includes('interview'),
      `pending=[${scored.result.manualPending.join(',')}]`)
    check('keyword match computed', scored.result.keyword.percent > 0,
      `${scored.result.keyword.percent}%`)
  }

  const persistedScores = await prisma.applicationCriterionScore.count({ where: { applicationId: application.id } })
  check('per-criterion scores persisted', persistedScores === 4, `${persistedScores} rows`)
  const persistedHits = await prisma.applicationKeywordHit.count({ where: { applicationId: application.id } })
  check('keyword hits persisted', persistedHits === 3, `${persistedHits} rows`)

  // Now the auto-rejection path.
  await prisma.jobApplication.update({
    where: { id: application.id },
    data: { answers: { ...answers, declarations: { corruption: { answer: true }, vetting: { answer: true } } } as any }
  })
  const rejected = await scoreAndPersist(application.id)
  check('adverse declaration triggers auto-rejection', rejected?.autoRejected === true)
  check('auto-rejection does NOT zero the score', (rejected?.result.total ?? 0) > 0,
    `total=${rejected?.result.total} — HR still needs the number for reporting`)

  console.log('\n=== 4. Notification outbox and delay ===')
  const jobRow = await prisma.job.findUnique({ where: { id: job.id }, select: { title: true, department: true, closingDate: true, grade: true } })
  const appRow = await prisma.jobApplication.findUnique({
    where: { id: application.id },
    select: { referenceNumber: true, firstName: true, lastName: true, email: true, submittedAt: true, finalScore: true }
  })

  const queued = await enqueueNotification({
    templateKey: 'application.auto_rejected',
    to: { email: appRow!.email, name: appRow!.firstName },
    variables: buildApplicationVariables({
      application: appRow as any, job: jobRow as any, stage: autoReject as any,
      extra: { publicReason: 'Your application could not be progressed at this time.' }
    }),
    contextType: 'application', contextId: application.id,
    delayMinutes: autoReject?.notificationDelayMinutes ?? 0,
    jitterMinutes: autoReject?.notificationDelayJitterMinutes ?? 0
  })
  check('notification queued', queued.queued, queued.reason ?? '')
  check('no unresolved template tokens', (queued.missingTokens?.length ?? 0) === 0,
    queued.missingTokens?.join(', ') || 'all resolved')

  if (queued.scheduledFor) {
    const hoursOut = (queued.scheduledFor.getTime() - Date.now()) / 3_600_000
    check('rejection is delayed, not instant', hoursOut > 24,
      `due in ${hoursOut.toFixed(1)}h — ${queued.scheduledFor.toISOString()}`)
  }

  const outboxRow = await prisma.emailOutbox.findFirst({
    where: { contextId: application.id },
    select: { subject: true, bodyHtml: true, bodyText: true, status: true }
  })
  check('outbox row is SCHEDULED, not sent', outboxRow?.status === 'SCHEDULED')
  check('subject rendered from the template', Boolean(outboxRow?.subject?.includes(TAG)),
    outboxRow?.subject ?? '')
  check('plain-text part derived', (outboxRow?.bodyText?.length ?? 0) > 50)
  check('candidate never sees the internal label',
    !outboxRow?.bodyHtml?.includes('Auto-rejected') && !outboxRow?.bodyText?.includes('Auto-rejected'),
    'internal label absent from the email')

  // Cancelling on a stage change, which is what stops a queued rejection going out.
  const { cancelPendingNotifications } = await import('../server/utils/outbox')
  const cancelled = await cancelPendingNotifications('application', application.id)
  check('pending notification can be cancelled', cancelled === 1, `${cancelled} cancelled`)

  console.log('\n=== cleanup ===')
  await prisma.jobApplication.delete({ where: { id: application.id } })
  await prisma.emailOutbox.deleteMany({ where: { contextId: application.id } })
  await prisma.job.delete({ where: { id: job.id } })
  await prisma.recruitmentStage.deleteMany({ where: { key: { startsWith: 'VERIFY-' } } })
  const leftoverJobs = await prisma.job.count({ where: { slug: { startsWith: 'verify-' } } })
  check('fixtures removed', leftoverJobs === 0)

  console.log(`\n${failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`}\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('\n💥 Verification crashed:', e)
  process.exit(1)
})
