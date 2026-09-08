/**
 * Demo data for the recruitment module: vacancies, candidates and applications
 * spread across every pipeline stage.
 *
 * Two rules govern this file.
 *
 * **Scores are computed, never invented.** Every application is run through the
 * same `scoreApplication` the live wizard and the submit endpoint use, against a
 * real scheme attached to the vacancy. A demo with fabricated numbers looks
 * correct and teaches QA nothing — worse, it hides scoring bugs behind
 * plausible-looking data.
 *
 * **Everything is marked and reversible.** Demo vacancies carry a `demo-` slug
 * prefix and demo candidates a `@demo.zacc.test` email domain, so `--reset`
 * removes exactly what this script created and nothing else. Nothing here
 * touches a row it did not write.
 *
 * Run:
 *   npm run prisma:seed:recruitment        # stages + templates (prerequisite)
 *   npm run prisma:seed:demo               # this file
 *   npm run prisma:seed:demo -- --reset    # wipe demo data and rebuild
 *   npm run prisma:seed:demo -- --clean    # wipe demo data and stop
 *
 * Options: --reset  --clean  --seed=<int>  --vacancies=<n>  --candidates=<n>  --applications=<n>
 */
import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'
import { parseDatabaseUrl } from '../server/utils/databaseUrl'
import { scoreApplication } from '../shared/recruitment/scoring'
import { highestQualification, meetsQualification, QUALIFICATION_LEVELS } from '../shared/recruitment/qualifications'
import { DECLARATIONS, declarationQuestion, isAdverseDeclaration } from '../shared/recruitment/declarations'
import { aggregatePanelScores, collapseToReviewerEntries } from '../shared/recruitment/panel'
import type { ScorableApplication, ScoringInput, ScoringResult } from '../shared/recruitment/types'
import { Rng, addDays, addMinutes } from './demo/random'
import {
  FIRST_NAMES_F, FIRST_NAMES_M, SURNAMES, PROVINCES, INSTITUTIONS, EMPLOYERS,
  FIELDS_OF_STUDY, PROFESSIONAL_BODIES, HOW_HEARD, SKILL_POOLS, JOB_TITLES_BY_DOMAIN,
  REASONS_FOR_LEAVING, DISABILITY_DETAIL
} from './demo/pools'
import { ARCHETYPES, DOCUMENT_SLOTS, GRADES } from './demo/vacancies'
import type { Archetype } from './demo/vacancies'

// ---------------------------------------------------------------------------
// Markers — the only thing standing between --reset and someone's real data
// ---------------------------------------------------------------------------

const DEMO_SLUG_PREFIX = 'demo-'
const DEMO_EMAIL_DOMAIN = '@demo.zacc.test'
/** One shared password for every demo candidate, so QA can sign in as any of them. */
const DEMO_PASSWORD = 'Demo@Candidate2026'
const DEMO_STAFF_PASSWORD = 'Demo@Panel2026'

/**
 * Interview panel members, created only when the installation has fewer than
 * three staff accounts. Named rather than "Reviewer 1/2/3" because the panel
 * screens show these names next to scores, and a disagreement between "Reviewer
 * 1" and "Reviewer 2" reads as test noise rather than as the thing to look at.
 */
const DEMO_PANEL_STAFF = [
  { handle: 'panel.chikomba', name: 'Rudo Chikomba (Panel Chair)' },
  { handle: 'panel.sibanda', name: 'Nkosana Sibanda' },
  { handle: 'panel.mutasa', name: 'Tariro Mutasa' },
  { handle: 'panel.ndlovu', name: 'Bhekimpilo Ndlovu' }
] as const

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)
const flag = (name: string) => argv.includes(`--${name}`)
const num = (name: string, fallback: number) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  const parsed = hit ? Number(hit.split('=')[1]) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const OPTS = {
  reset: flag('reset') || flag('clean'),
  /** Remove the demo data and stop, for clearing a fixture before a real demo. */
  cleanOnly: flag('clean'),
  seed: num('seed', 20260902),
  vacancies: num('vacancies', 52),
  candidates: num('candidates', 60),
  applications: num('applications', 260)
}

const rng = new Rng(OPTS.seed)
const NOW = new Date()

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const round1 = (n: number) => Math.round(n * 10) / 10

/** `YYYY-MM`, the format the wizard stores employment dates in. */
const monthOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const provinceByWeight = () =>
  rng.weighted(PROVINCES.map((p) => [p, p.weight] as const))

/** A Zimbabwean mobile number that is obviously fictional. */
const phoneNumber = () => `+263 7${rng.int(1, 8)} ${rng.int(100, 999)} ${rng.int(1000, 9999)}`

/** National ID in the Zimbabwean format, with an invalid district code. */
const nationalId = () => `${rng.int(10, 84)}-${rng.int(100000, 999999)}${rng.pick(['A', 'B', 'C', 'D', 'E'])}-${rng.int(10, 99)}`

type Stage = {
  id: string
  key: string
  internalLabel: string
  publicLabel: string
  legacyStatus: string | null
  sortOrder: number
  isRejection: boolean
  isTerminal: boolean
  notifyCandidate: boolean
  notificationTemplate: { id: string; key: string; subject: string; bodyHtml: string; bodyText: string } | null
  notificationDelayMinutes: number
  notificationDelayJitterMinutes: number
}

// ---------------------------------------------------------------------------
// Candidate generation
// ---------------------------------------------------------------------------

interface DemoCandidate {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  altPhone: string | null
  gender: 'Male' | 'Female'
  dateOfBirth: Date
  nationalId: string
  province: string
  city: string
  hasDisability: boolean
  disabilityDetail: string | null
  /** 0..1. Drives qualification, experience and keyword coverage together. */
  quality: number
  domain: keyof typeof SKILL_POOLS
  totalYears: number
  isCurrentlyEmployed: boolean
  highestLevel: string
  qualifications: Array<Record<string, unknown>>
  employment: Array<Record<string, unknown>>
  skills: string[]
  memberships: Array<{ bodyName: string; status: string }>
  languages: Array<Record<string, unknown>>
  driversLicenceClass: string | null
}

function buildCandidate(index: number): DemoCandidate {
  const gender = rng.chance(0.47) ? 'Female' : 'Male'
  const firstName = gender === 'Female' ? rng.pick(FIRST_NAMES_F) : rng.pick(FIRST_NAMES_M)
  const lastName = rng.pick(SURNAMES)
  const prov = provinceByWeight()

  // Quality is the single dial. Everything downstream — qualification, years,
  // keyword coverage, notice period — is drawn around it, so a strong candidate
  // is strong consistently rather than being a random mix of good and bad.
  const quality = rng.normal(0.55, 0.22, 0.02, 0.99)
  const domain = rng.pick(Object.keys(SKILL_POOLS).filter((k) => k !== 'generic')) as keyof typeof SKILL_POOLS

  const age = Math.round(rng.normal(34 + quality * 8, 7, 22, 58))
  const dateOfBirth = new Date(NOW.getFullYear() - age, rng.int(0, 11), rng.int(1, 28))

  // Years of experience cannot exceed a plausible working life.
  const maxYears = Math.max(0, age - 21)
  const totalYears = Math.round(Math.min(maxYears, rng.normal(2 + quality * 14, 3.5, 0, 30)))

  // Qualification ladder position tracks quality, with real slippage — plenty of
  // capable people hold a diploma and plenty of degree-holders interview badly.
  const rankTarget = Math.round(rng.normal(4.2 + quality * 5.2, 1.4, 1, 10))
  const highest = QUALIFICATION_LEVELS.find((q) => q.rank === rankTarget) ?? QUALIFICATION_LEVELS[6]!

  const fieldPool = FIELDS_OF_STUDY
  const primaryField = rng.pick(fieldPool)

  const qualifications: Array<Record<string, unknown>> = [
    {
      level: highest.level,
      fieldOfStudy: highest.isSchoolLevel ? null : primaryField,
      institution: highest.isSchoolLevel ? `${rng.pick(prov.cities)} High School` : rng.pick(INSTITUTIONS),
      country: 'Zimbabwe',
      yearObtained: NOW.getFullYear() - Math.max(1, totalYears - rng.int(0, 3)),
      classGrade: highest.isSchoolLevel ? null : rng.pick(['Upper Second', 'Lower Second', 'First Class', 'Pass']),
      result: highest.isSchoolLevel ? `${rng.int(5, 9)} subjects` : null
    }
  ]
  // Almost everyone also lists school-level results.
  if (!highest.isSchoolLevel) {
    qualifications.push({
      level: 'A_LEVEL', fieldOfStudy: null,
      institution: `${rng.pick(prov.cities)} High School`, country: 'Zimbabwe',
      yearObtained: NOW.getFullYear() - totalYears - rng.int(3, 6),
      classGrade: null, result: `${rng.int(6, 15)} points`
    })
  }
  if (quality > 0.7 && rng.chance(0.45)) {
    qualifications.push({
      level: 'POSTGRAD_DIPLOMA', fieldOfStudy: rng.pick(fieldPool),
      institution: rng.pick(INSTITUTIONS), country: 'Zimbabwe',
      yearObtained: NOW.getFullYear() - rng.int(1, 5), classGrade: 'Pass', result: null
    })
  }

  // Employment history walks backwards from today.
  const isCurrentlyEmployed = rng.chance(0.55 + quality * 0.3)
  const positions: Array<Record<string, unknown>> = []
  let cursorYears = totalYears
  let posIndex = 0
  while (cursorYears > 0.5 && posIndex < 4) {
    const span = Math.min(cursorYears, Math.max(1, Math.round(rng.normal(3.5, 2, 1, 9))))
    const to = addDays(NOW, -Math.round((totalYears - cursorYears) * 365))
    const from = addDays(to, -Math.round(span * 365))
    const isCurrent = posIndex === 0 && isCurrentlyEmployed
    positions.push({
      employer: rng.pick(EMPLOYERS),
      jobTitle: rng.pick(JOB_TITLES_BY_DOMAIN[domain]),
      fromMonth: monthOf(from),
      toMonth: isCurrent ? null : monthOf(to),
      isCurrent,
      salary: rng.int(400, 3200),
      // The responsibilities text is one of the corpora the keyword matcher
      // reads, so it has to contain real terms, not filler.
      responsibilities: rng
        .sample(SKILL_POOLS[domain], rng.int(2, 4))
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('. ') + '.',
      reasonForLeaving: isCurrent ? 'Currently employed' : rng.pick(REASONS_FOR_LEAVING),
      noticePeriod: isCurrent ? rng.pick(['1 month', '3 months', 'Immediate']) : null,
      supervisorName: `${rng.pick(FIRST_NAMES_M)} ${rng.pick(SURNAMES)}`,
      supervisorRole: 'Head of Department',
      supervisorPhone: phoneNumber()
    })
    cursorYears -= span
    posIndex++
  }

  // Keyword coverage: strong candidates list more of their own domain, everyone
  // lists some generic office skills.
  const domainCount = Math.round(1 + quality * (SKILL_POOLS[domain].length - 2))
  const skills = [
    ...rng.sample(SKILL_POOLS[domain], domainCount),
    ...rng.sample(SKILL_POOLS.generic, rng.int(2, 5))
  ]

  const memberships = quality > 0.6 && rng.chance(0.5)
    ? [{ bodyName: rng.pick(PROFESSIONAL_BODIES), status: rng.pick(['Member', 'Associate', 'Fellow']) }]
    : []

  const languages = [
    { language: 'English', read: 'FLUENT', write: 'FLUENT', speak: 'FLUENT' },
    {
      language: prov.name === 'Bulawayo' || prov.name.startsWith('Matabeleland') ? 'Ndebele' : 'Shona',
      read: rng.pick(['NATIVE', 'FLUENT', 'GOOD']),
      write: rng.pick(['NATIVE', 'FLUENT', 'GOOD']),
      speak: 'NATIVE'
    }
  ]

  const hasDisability = rng.chance(0.05)

  return {
    firstName,
    lastName,
    email: `${slugify(firstName)}.${slugify(lastName)}${index}${DEMO_EMAIL_DOMAIN}`,
    phone: phoneNumber(),
    altPhone: rng.chance(0.4) ? phoneNumber() : null,
    gender,
    dateOfBirth,
    nationalId: nationalId(),
    province: prov.name,
    city: rng.pick(prov.cities),
    hasDisability,
    disabilityDetail: hasDisability ? rng.pick(DISABILITY_DETAIL) : null,
    quality,
    domain,
    totalYears,
    isCurrentlyEmployed,
    highestLevel: highest.level,
    qualifications,
    employment: positions,
    skills,
    memberships,
    languages,
    driversLicenceClass: rng.chance(0.55) ? rng.pick(['4', '2', '4 and 2']) : null
  }
}

// ---------------------------------------------------------------------------
// The wizard payload, built exactly as the real wizard would build it
// ---------------------------------------------------------------------------

function buildAnswers(c: DemoCandidate, job: { id: string; archetype: Archetype }): ScorableApplication {
  const a = job.archetype

  // Declarations. The adverse ones are rare, which is what makes the
  // auto-rejection cases worth looking at when they do appear.
  const declaredCriminal = rng.chance(0.045)
  const declaredCorruption = rng.chance(0.035)
  const refusesVetting = rng.chance(0.02)
  const hasRelatives = rng.chance(0.08)

  const declarations: ScorableApplication['declarations'] = {
    corruption: {
      answer: declaredCorruption,
      explanation: declaredCorruption
        ? 'Investigated by the Commission in 2021 following an audit query at a former employer. The matter was closed with no charge; closure letter attached.'
        : null
    },
    criminal: {
      answer: declaredCriminal,
      explanation: declaredCriminal
        ? 'Convicted of a road traffic offence in 2019 and fined. No custodial sentence. Certified court record attached.'
        : null
    },
    relatives: {
      answer: hasRelatives,
      explanation: hasRelatives
        ? `${rng.pick(FIRST_NAMES_F)} ${c.lastName}, sibling, ${rng.pick(['Investigations', 'Finance', 'Administration'])} Department.`
        : null
    },
    vetting: { answer: !refusesVetting, explanation: null }
  }

  // Notice period tracks employment: unemployed candidates are available now.
  const noticePeriodDays = c.isCurrentlyEmployed
    ? rng.weighted([[7, 2], [30, 5], [60, 3], [90, 2], [120, 1]] as const)
    : rng.int(0, 7)

  // Applicants to a post outside their own discipline exist and should score
  // poorly on keywords rather than being filtered out of the fixture.
  const onTarget = c.domain === a.domain || rng.chance(0.35)
  const skillList = onTarget
    ? c.skills
    : [...rng.sample(SKILL_POOLS.generic, 4), ...rng.sample(c.skills, 2)]

  return {
    personal: {
      dateOfBirth: c.dateOfBirth.toISOString().slice(0, 10),
      gender: c.gender,
      province: c.province,
      city: c.city,
      nationality: 'Zimbabwean',
      hasDisability: c.hasDisability
    },
    position: {
      jobId: job.id,
      noticePeriodDays,
      willingToRelocate: rng.chance(0.68),
      expectedSalary: rng.int(600, 4200),
      howHeard: rng.pick(HOW_HEARD)
    },
    qualifications: c.qualifications as any,
    memberships: c.memberships,
    employment: {
      totalYears: c.totalYears,
      isCurrentlyEmployed: c.isCurrentlyEmployed,
      positions: c.employment as any
    },
    declarations,
    skills: { raw: skillList.join(', '), list: skillList },
    languages: c.languages as any,
    documents: [
      { slotKey: 'cv', fileName: `${slugify(c.firstName)}-${slugify(c.lastName)}-cv.pdf`, fileUrl: `recruitment/demo/${slugify(c.lastName)}-cv.pdf`, fileSize: rng.int(90_000, 480_000) },
      { slotKey: 'national_id', fileName: 'national-id.pdf', fileUrl: `recruitment/demo/${slugify(c.lastName)}-id.pdf`, fileSize: rng.int(40_000, 200_000) },
      // A small share omit the mandatory certificates, which is exactly what the
      // MISSING_DOCUMENT path and the "action needed" verification state are for.
      ...(rng.chance(0.9)
        ? [{ slotKey: 'certificates', fileName: 'certified-certificates.pdf', fileUrl: `recruitment/demo/${slugify(c.lastName)}-certs.pdf`, fileSize: rng.int(200_000, 2_400_000) }]
        : []),
      ...(c.memberships.length && rng.chance(0.7)
        ? [{ slotKey: 'professional_membership', fileName: 'membership.pdf', fileUrl: `recruitment/demo/${slugify(c.lastName)}-membership.pdf`, fileSize: rng.int(60_000, 300_000) }]
        : []),
      ...(rng.chance(0.25)
        ? [{ slotKey: 'police_clearance', fileName: 'police-clearance.pdf', fileUrl: `recruitment/demo/${slugify(c.lastName)}-clearance.pdf`, fileSize: rng.int(60_000, 260_000) }]
        : [])
    ],
    driversLicence: c.driversLicenceClass
      ? { has: true, class: c.driversLicenceClass, expiry: addDays(NOW, rng.int(120, 2000)).toISOString().slice(0, 10) }
      : { has: false, class: null, expiry: null }
  }
}

// ---------------------------------------------------------------------------
// Stage selection — a funnel, not a uniform spread
// ---------------------------------------------------------------------------

/**
 * A console where every stage holds the same number of applications looks
 * nothing like a real pipeline and makes the reports meaningless. This is
 * shaped as a funnel and conditioned on the score, so the shortlist is
 * genuinely the top of the pile.
 */
function pickStageKey(score: number): string {
  if (score >= 78) {
    return rng.weighted([
      ['offer', 5], ['reserve', 8], ['security_checks', 11], ['reference_checks', 9],
      ['interview', 16], ['shortlisted', 22], ['shortlisting', 17], ['eligibility_screening', 8],
      ['rejected', 4]
    ] as const)
  }
  if (score >= 62) {
    return rng.weighted([
      ['shortlisted', 17], ['shortlisting', 22], ['interview', 9], ['security_checks', 4],
      ['eligibility_screening', 20], ['reserve', 11], ['rejected', 14], ['received', 3]
    ] as const)
  }
  if (score >= 45) {
    return rng.weighted([
      ['eligibility_screening', 30], ['shortlisting', 15], ['received', 12],
      ['reserve', 10], ['rejected', 33]
    ] as const)
  }
  return rng.weighted([
    ['rejected', 55], ['eligibility_screening', 18], ['received', 22], ['reserve', 5]
  ] as const)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set. Create a .env with DATABASE_URL="mysql://user:pass@host:port/db".')
  }

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(parseDatabaseUrl(dbUrl)),
    log: ['warn', 'error']
  })

  try {
    console.log(`\n🎬 Recruitment demo seed  ·  rng seed ${OPTS.seed}\n`)

    // --- Preflight ---------------------------------------------------------
    const stages = (await prisma.recruitmentStage.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true, key: true, internalLabel: true, publicLabel: true, legacyStatus: true,
        sortOrder: true, isRejection: true, isTerminal: true, notifyCandidate: true,
        notificationDelayMinutes: true, notificationDelayJitterMinutes: true,
        notificationTemplate: { select: { id: true, key: true, subject: true, bodyHtml: true, bodyText: true } }
      }
    })) as unknown as Stage[]

    if (stages.length < 5) {
      throw new Error(
        'Pipeline stages are missing. Run `npm run prisma:seed:recruitment` first — this seed ' +
        'places applications on those stages and cannot invent them.'
      )
    }
    const stageByKey = new Map(stages.map((s) => [s.key, s]))
    const need = ['received', 'eligibility_screening', 'shortlisted', 'rejected', 'auto_rejected', 'withdrawn']
    const missing = need.filter((k) => !stageByKey.has(k))
    if (missing.length) throw new Error(`Missing pipeline stage(s): ${missing.join(', ')}`)

    const templates = await prisma.notificationTemplate.findMany({
      select: { id: true, key: true, subject: true, bodyHtml: true, bodyText: true }
    })
    const templateByKey = new Map(templates.map((t) => [t.key, t]))

    // --- Existing demo data ------------------------------------------------
    const existingJobs = await prisma.job.count({ where: { slug: { startsWith: DEMO_SLUG_PREFIX } } })
    const existingCandidates = await prisma.candidate.count({ where: { email: { endsWith: DEMO_EMAIL_DOMAIN } } })

    if (OPTS.cleanOnly && !existingJobs && !existingCandidates) {
      console.log('Nothing to clean — no demo data present.\n')
      return
    }

    if ((existingJobs || existingCandidates) && !OPTS.reset) {
      console.log(
        `Demo data is already present: ${existingJobs} vacancies, ${existingCandidates} candidates.\n` +
        'Re-run with --reset to replace it:\n\n    npm run prisma:seed:demo -- --reset\n'
      )
      return
    }

    if (OPTS.reset && (existingJobs || existingCandidates)) {
      console.log('🧹 Removing existing demo data...')
      const demoJobIds = (await prisma.job.findMany({
        where: { slug: { startsWith: DEMO_SLUG_PREFIX } }, select: { id: true }
      })).map((j) => j.id)

      const demoAppIds = demoJobIds.length
        ? (await prisma.jobApplication.findMany({ where: { jobId: { in: demoJobIds } }, select: { id: true } })).map((a) => a.id)
        : []

      // The outbox holds no foreign key to the application — contextId is a
      // loose string — so these have to go explicitly or they would be orphaned.
      if (demoAppIds.length) {
        const { count } = await prisma.emailOutbox.deleteMany({
          where: { contextType: 'application', contextId: { in: demoAppIds } }
        })
        console.log(`   · ${count} queued/sent notifications`)
      }
      if (demoJobIds.length) {
        await prisma.recruitmentAuditLog.deleteMany({ where: { jobId: { in: demoJobIds } } })
        const { count } = await prisma.job.deleteMany({ where: { id: { in: demoJobIds } } })
        console.log(`   · ${count} vacancies (applications and schemes cascade)`)
      }
      const { count: candidateCount } = await prisma.candidate.deleteMany({
        where: { email: { endsWith: DEMO_EMAIL_DOMAIN } }
      })
      console.log(`   · ${candidateCount} candidate accounts`)

      // Demo reviewers go too. Their panel scores have already gone with the
      // applications; anything they touched outside the demo is not theirs to have.
      const { count: staffCount } = await prisma.user.deleteMany({
        where: { email: { endsWith: DEMO_EMAIL_DOMAIN } }
      })
      console.log(`   · ${staffCount} demo panel reviewers\n`)

      if (OPTS.cleanOnly) {
        console.log('✅ Demo data removed. Nothing else was touched.\n')
        return
      }
    }

    // Panel members are real staff accounts. Without at least two there is no
    // panel worth seeding — no independent scores, and no disagreement to
    // surface — so the seed creates named reviewers when the installation has
    // none. They carry the demo email domain, so --reset removes them, and they
    // are EDITOR rather than admin: a demo fixture should not mint an account
    // that can change site settings.
    let staff = await prisma.user.findMany({
      where: { isActive: true, email: { not: { endsWith: DEMO_EMAIL_DOMAIN } } },
      select: { id: true, name: true, email: true, role: true },
      take: 12
    })

    if (staff.length < 3) {
      const staffHash = await bcrypt.hash(DEMO_STAFF_PASSWORD, 10)
      for (const person of DEMO_PANEL_STAFF) {
        const email = `${person.handle}${DEMO_EMAIL_DOMAIN}`
        await prisma.user.upsert({
          where: { email },
          update: { name: person.name, isActive: true },
          create: { email, name: person.name, passwordHash: staffHash, role: 'EDITOR', isActive: true }
        })
      }
      console.log(`👤 Added ${DEMO_PANEL_STAFF.length} demo panel reviewers (role EDITOR).`)
    }

    staff = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      take: 12
    })

    // =======================================================================
    // 1. Vacancies
    // =======================================================================
    console.log(`📋 Creating ${OPTS.vacancies} vacancies...`)

    interface CreatedVacancy {
      id: string
      slug: string
      title: string
      archetype: Archetype
      mode: 'LEGACY' | 'STRUCTURED'
      closingDate: Date
      openingDate: Date
      isPublished: boolean
      isActive: boolean
      province: string
      criteria: Array<{ id: string; key: string; type: string; maxPoints: number; config: any; bucket: string; weight: number; sourceField: string | null; isPanelScored: boolean; showToCandidate: boolean; sortOrder: number; label: string }>
      disqualifiers: Array<{ id: string; key: string; label: string; type: string; sourceField: string | null; config: any; action: string; severity: string; publicReason: string | null; internalReason: string | null }>
      panelUserIds: string[]
    }

    const vacancies: CreatedVacancy[] = []
    const usedSlugs = new Set<string>()

    for (let i = 0; i < OPTS.vacancies; i++) {
      const archetype = ARCHETYPES[i % ARCHETYPES.length]!
      const title = rng.pick(archetype.titles)
      const prov = provinceByWeight()
      const dutyStation = rng.pick(prov.cities)

      let slug = `${DEMO_SLUG_PREFIX}${slugify(title)}-${slugify(dutyStation)}`
      let suffix = 2
      while (usedSlugs.has(slug)) slug = `${DEMO_SLUG_PREFIX}${slugify(title)}-${slugify(dutyStation)}-${suffix++}`
      usedSlugs.add(slug)

      // A register spanning two recruitment cycles: some open, some closed, a
      // few unpublished drafts, a couple deactivated. All four states are things
      // the vacancies list has to render and filter.
      const lifecycle = rng.weighted([
        ['open', 46], ['closing_soon', 14], ['closed', 26], ['draft', 10], ['inactive', 4]
      ] as const)

      const closingDate =
        lifecycle === 'open' ? addDays(NOW, rng.int(15, 75))
          : lifecycle === 'closing_soon' ? addDays(NOW, rng.int(1, 10))
          : lifecycle === 'closed' ? addDays(NOW, -rng.int(5, 240))
          : addDays(NOW, rng.int(20, 60))

      const openingDate = addDays(closingDate, -rng.int(21, 45))
      const isPublished = lifecycle !== 'draft'
      const isActive = lifecycle !== 'inactive'

      // A handful stay on the old single-page form so the LEGACY path, and the
      // "unconfigured vacancy" warning, both have real rows behind them.
      const mode: 'LEGACY' | 'STRUCTURED' = i % 9 === 8 ? 'LEGACY' : 'STRUCTURED'

      const jobDescriptionText = [
        ...archetype.responsibilities,
        ...archetype.requirements
      ].join(' ')

      const job = await prisma.job.create({
        data: {
          title,
          slug,
          department: archetype.department,
          location: prov.name,
          type: rng.weighted([['Full-time', 8], ['Contract', 2], ['Internship', 1]] as const),
          summary: `${title} based in ${dutyStation}. ${archetype.responsibilities[0]}`,
          description:
            `<p>The Zimbabwe Anti-Corruption Commission invites applications from suitably ` +
            `qualified Zimbabwean citizens for the post of <strong>${title}</strong>, based at ` +
            `${dutyStation}.</p><h3>Duties and responsibilities</h3><ul>` +
            archetype.responsibilities.map((r) => `<li>${r}</li>`).join('') +
            `</ul><h3>Qualifications and experience</h3><ul>` +
            archetype.requirements.map((r) => `<li>${r}</li>`).join('') +
            `</ul>`,
          keyRequirements: archetype.requirements as any,
          responsibilities: archetype.responsibilities as any,
          benefits: 'Medical aid, pension, and a Commission vehicle scheme for grades C1 and above.',
          closingDate,
          openingDate,
          isPublished,
          isActive,
          publishedAt: isPublished ? addDays(openingDate, -rng.int(0, 3)) : null,

          applicationMode: mode,
          grade: rng.pick(GRADES),
          dutyStation,
          province: prov.name,
          numberOfPosts: rng.weighted([[1, 12], [2, 4], [3, 2], [5, 1]] as const),
          jobDescriptionText,
          keywords: mode === 'STRUCTURED' ? (archetype.keywords as any) : undefined,
          bucketWeights: mode === 'STRUCTURED' ? (archetype.bucketWeights as any) : undefined,
          minYearsExperience: archetype.minYearsExperience,
          maxNoticePeriodDays: 120,
          panelAggregation: rng.weighted([['MEAN', 8], ['MEDIAN', 2], ['TRIMMED_MEAN', 1]] as const),
          panelSpreadThreshold: rng.pick([15, 20, 25]),
          panelBlindDemographics: true,
          panelBlindIdentity: rng.chance(0.15),
          autoRejectEnabled: mode === 'STRUCTURED',
          scoringVersion: 1
        },
        select: { id: true }
      })

      const created: CreatedVacancy = {
        id: job.id, slug, title, archetype, mode, closingDate, openingDate,
        isPublished, isActive, province: prov.name,
        criteria: [], disqualifiers: [], panelUserIds: []
      }

      if (mode === 'STRUCTURED') {
        // Criteria. The KEYWORD criterion is filled from the archetype's own
        // keyword set so the scoring engine has something real to match against.
        for (const [order, spec] of archetype.criteria.entries()) {
          const config =
            spec.type === 'KEYWORD'
              ? {
                  ...spec.config,
                  required: archetype.keywords.required,
                  preferred: archetype.keywords.preferred,
                  synonyms: archetype.keywords.synonyms ?? {}
                }
              : spec.config

          const row = await prisma.vacancyCriterion.create({
            data: {
              jobId: job.id,
              key: spec.key,
              label: spec.label,
              bucket: spec.bucket as any,
              type: spec.type as any,
              weight: spec.weight,
              maxPoints: spec.maxPoints,
              config: config as any,
              sourceField: spec.sourceField ?? null,
              isAutoScored: spec.type !== 'MANUAL',
              isPanelScored: spec.isPanelScored ?? false,
              showToCandidate: spec.showToCandidate ?? true,
              sortOrder: order + 1
            },
            select: { id: true }
          })
          created.criteria.push({
            id: row.id, key: spec.key, label: spec.label, type: spec.type,
            maxPoints: spec.maxPoints, config, bucket: spec.bucket, weight: spec.weight,
            sourceField: spec.sourceField ?? null,
            isPanelScored: spec.isPanelScored ?? false,
            showToCandidate: spec.showToCandidate ?? true,
            sortOrder: order + 1
          })
        }

        for (const [order, d] of archetype.disqualifiers.entries()) {
          const row = await prisma.vacancyDisqualifier.create({
            data: {
              jobId: job.id, key: d.key, label: d.label, type: d.type as any,
              sourceField: d.sourceField ?? null, config: d.config as any,
              action: d.action as any, severity: d.severity as any,
              publicReason: d.publicReason ?? null, internalReason: d.internalReason ?? null,
              isActive: true, sortOrder: order + 1
            },
            select: { id: true }
          })
          created.disqualifiers.push({
            id: row.id, key: d.key, label: d.label, type: d.type,
            sourceField: d.sourceField ?? null, config: d.config,
            action: d.action, severity: d.severity,
            publicReason: d.publicReason ?? null, internalReason: d.internalReason ?? null
          })
        }

        await prisma.vacancyDocumentSlot.createMany({
          data: DOCUMENT_SLOTS.map((s) => ({
            jobId: job.id,
            key: s.key,
            label: s.label,
            description: s.description,
            isMandatory: s.isMandatory,
            allowMultiple: (s as any).allowMultiple ?? false,
            maxFiles: (s as any).maxFiles ?? 1,
            allowedExtensions: s.allowedExtensions as any,
            maxSizeBytes: s.maxSizeBytes,
            sortOrder: s.sortOrder
          }))
        })

        if (staff.length >= 2) {
          const panel = rng.sample(staff, Math.min(staff.length, rng.int(2, 4)))
          for (const [idx, member] of panel.entries()) {
            await prisma.vacancyPanelMember.create({
              data: {
                jobId: job.id,
                userId: member.id,
                role: idx === 0 ? 'CHAIR' : 'MEMBER',
                canSeeIdentity: true,
                canSeeDemographics: false,
                canSeeOtherScores: idx === 0
              }
            })
            created.panelUserIds.push(member.id)
          }
        }
      }

      vacancies.push(created)
    }

    const structured = vacancies.filter((v) => v.mode === 'STRUCTURED')
    console.log(`   ✓ ${vacancies.length} vacancies (${structured.length} screened, ${vacancies.length - structured.length} legacy)\n`)

    // =======================================================================
    // 2. Candidates
    // =======================================================================
    console.log(`👥 Creating ${OPTS.candidates} candidate accounts...`)
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
    const candidates: DemoCandidate[] = []

    for (let i = 0; i < OPTS.candidates; i++) {
      const c = buildCandidate(i + 1)
      const row = await prisma.candidate.create({
        data: {
          email: c.email,
          passwordHash,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          isActive: true,
          // Most are verified; a few are not, so the "unverified account" path
          // has rows behind it.
          emailVerifiedAt: rng.chance(0.9) ? addDays(NOW, -rng.int(1, 300)) : null,
          lastLoginAt: rng.chance(0.75) ? addDays(NOW, -rng.int(0, 60)) : null,
          profile: {
            create: {
              dateOfBirth: c.dateOfBirth,
              nationalIdType: 'National ID',
              nationalId: c.nationalId,
              nationality: 'Zimbabwean',
              gender: c.gender,
              hasDisability: c.hasDisability,
              disabilityDetail: c.disabilityDetail,
              province: c.province,
              city: c.city,
              altPhone: c.altPhone,
              currentAddress: `${rng.int(1, 240)} ${rng.pick(SURNAMES)} Road, ${c.city}`,
              qualifications: c.qualifications as any,
              memberships: c.memberships as any,
              employment: c.employment as any,
              skills: c.skills as any,
              languages: c.languages as any,
              driversLicenceClass: c.driversLicenceClass,
              completionPct: Math.round(60 + c.quality * 40)
            }
          }
        },
        select: { id: true }
      })
      c.id = row.id
      candidates.push(c)
    }
    console.log(`   ✓ ${candidates.length} candidates (password for all: ${DEMO_PASSWORD})\n`)

    // =======================================================================
    // 3. Applications
    // =======================================================================
    console.log(`📨 Creating ~${OPTS.applications} applications...`)

    const usedReferences = new Set<string>(
      (await prisma.jobApplication.findMany({
        where: { referenceNumber: { not: null } }, select: { referenceNumber: true }
      })).map((r) => r.referenceNumber!)
    )
    let referenceCounter = 1
    const nextReference = (year: number) => {
      for (;;) {
        const ref = `ZACC-APP-${year}-${String(90_000_000 + referenceCounter++).padStart(8, '0')}`
        if (!usedReferences.has(ref)) {
          usedReferences.add(ref)
          return ref
        }
      }
    }

    // One candidate may apply to several posts, but never twice to the same one
    // — the submit endpoint refuses that, and fixture data that contradicts a
    // constraint is a trap for whoever tests it next.
    const appliedPairs = new Set<string>()
    const stats = {
      total: 0, structured: 0, legacy: 0, autoRejected: 0, withdrawn: 0,
      shortlisted: 0, panelReviewed: 0, heldRejections: 0, sentNotices: 0,
      byStage: new Map<string, number>()
    }

    const applyTargets = vacancies.filter((v) => v.isPublished && v.isActive)
    let attempts = 0

    while (stats.total < OPTS.applications && attempts < OPTS.applications * 6) {
      attempts++
      const candidate = rng.pick(candidates)

      // Most people apply within reach of their own qualification; a real
      // minority apply well above it, and those are exactly the applications
      // the auto-rejection rules exist to clear. Keeping that minority is the
      // point — removing it would hide the feature.
      const candidateLevel = highestQualification(candidate.qualifications.map((q: any) => q.level))
      const eligible = applyTargets.filter((v) =>
        meetsQualification(candidateLevel as any, v.archetype.requiredQualification as any) &&
        candidate.totalYears >= v.archetype.minYearsExperience
      )
      // Discipline matters as much as eligibility. An auditor applying for an
      // ICT post is a real occurrence but not the common one, and pairing
      // candidates to vacancies without regard to field made the keyword match
      // zero for most of the register — which would have read as a broken
      // matcher rather than as a mismatched applicant.
      const sameField = eligible.filter((v) => v.archetype.domain === candidate.domain)
      const pool =
        sameField.length && rng.chance(0.6) ? sameField
          : eligible.length && rng.chance(0.7) ? eligible
          : applyTargets
      const vacancy = rng.pick(pool)
      const pairKey = `${vacancy.id}:${candidate.id}`
      if (appliedPairs.has(pairKey)) continue
      appliedPairs.add(pairKey)

      // Submitted somewhere between the opening date and the closing date (or
      // today, whichever is sooner), so timelines read plausibly.
      const windowEnd = vacancy.closingDate < NOW ? vacancy.closingDate : NOW
      const windowStart = vacancy.openingDate < windowEnd ? vacancy.openingDate : addDays(windowEnd, -20)
      const submittedAt = rng.dateBetween(windowStart, windowEnd)
      const reference = nextReference(submittedAt.getFullYear())

      // ---- LEGACY vacancies: the original simple form, no scoring ----------
      if (vacancy.mode === 'LEGACY') {
        const stage = stageByKey.get(rng.weighted([
          ['received', 4], ['eligibility_screening', 3], ['shortlisted', 2], ['rejected', 3]
        ] as const))!
        await prisma.jobApplication.create({
          data: {
            jobId: vacancy.id,
            candidateId: candidate.id!,
            referenceNumber: reference,
            mode: 'LEGACY',
            stageId: stage.id,
            status: (stage.legacyStatus ?? 'PENDING') as any,
            submittedAt,
            createdAt: submittedAt,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
            phone: candidate.phone,
            qualification: QUALIFICATION_LEVELS.find((q) => q.level === candidate.highestLevel)?.label ?? null,
            experience: candidate.totalYears,
            coverLetter:
              `I wish to apply for the post of ${vacancy.title}. I hold a ` +
              `${QUALIFICATION_LEVELS.find((q) => q.level === candidate.highestLevel)?.label} and have ` +
              `${candidate.totalYears} years of relevant experience.`,
            cvUrl: `recruitment/demo/${slugify(candidate.lastName)}-cv.pdf`,
            stageEvents: {
              create: {
                stageId: stage.id, toStageKey: stage.key,
                toInternalLabel: stage.internalLabel, toPublicLabel: stage.publicLabel,
                isAutomated: true, note: 'Application submitted', createdAt: submittedAt
              }
            }
          }
        })
        stats.total++
        stats.legacy++
        stats.byStage.set(stage.key, (stats.byStage.get(stage.key) ?? 0) + 1)
        continue
      }

      // ---- STRUCTURED: build, score, place ---------------------------------
      const answers = buildAnswers(candidate, { id: vacancy.id, archetype: vacancy.archetype })

      const scoringInput = (panelByCriterion?: Record<string, number[]>): ScoringInput => ({
        vacancy: {
          id: vacancy.id,
          bucketWeights: vacancy.archetype.bucketWeights as any,
          keywords: vacancy.archetype.keywords,
          province: vacancy.province,
          minYearsExperience: vacancy.archetype.minYearsExperience,
          maxNoticePeriodDays: 120,
          closingDate: vacancy.closingDate.toISOString(),
          documentSlots: DOCUMENT_SLOTS.map((s) => ({ key: s.key, label: s.label, isMandatory: s.isMandatory }))
        },
        criteria: vacancy.criteria.map((c) => ({
          id: c.id, key: c.key, label: c.label, bucket: c.bucket as any, type: c.type as any,
          weight: c.weight, maxPoints: c.maxPoints, config: c.config,
          sourceField: c.sourceField, isAutoScored: c.type !== 'MANUAL',
          isPanelScored: c.isPanelScored, showToCandidate: c.showToCandidate, sortOrder: c.sortOrder
        })),
        disqualifiers: vacancy.disqualifiers.map((d) => ({
          id: d.id, key: d.key, label: d.label, type: d.type as any,
          sourceField: d.sourceField, config: d.config, action: d.action as any,
          severity: d.severity as any, publicReason: d.publicReason, internalReason: d.internalReason
        })),
        application: answers,
        panel: panelByCriterion
          ? { scoresByCriterion: panelByCriterion, aggregation: 'MEAN', spreadThreshold: 20 }
          : undefined,
        now: submittedAt.toISOString()
      })

      let result: ScoringResult = scoreApplication(scoringInput())

      // Stage first, because whether a panel ever looked at this application
      // depends on how far it got.
      let stageKey: string
      if (result.disqualified) stageKey = 'auto_rejected'
      else if (rng.chance(0.035)) stageKey = 'withdrawn'
      else stageKey = pickStageKey(result.total)

      const stage = stageByKey.get(stageKey)!

      /**
       * How far the application actually got before it stopped.
       *
       * For anything still in flight this is simply its current stage. For a
       * closed outcome it is not: "Not taken forward" and "Reserve list" both
       * sort *above* shortlisted, so treating their sortOrder as the high-water
       * mark would march every rejected application through interview and
       * security checks on its way to being rejected. Most rejections happen at
       * screening; a rejection after interview is rarer and more consequential,
       * and the fixture needs both.
       */
      const closedOutcome = stage.isRejection || stageKey === 'reserve' || stageKey === 'withdrawn'
      const exitKey = !closedOutcome
        ? stageKey
        : stageKey === 'auto_rejected'
          ? 'received'
          : rng.weighted(
              result.total >= 62
                ? ([['shortlisting', 4], ['shortlisted', 3], ['interview', 3], ['security_checks', 1]] as const)
                : ([['eligibility_screening', 7], ['shortlisting', 3], ['shortlisted', 1]] as const)
            )
      const exitCeiling = stageByKey.get(exitKey)?.sortOrder ?? stage.sortOrder

      const reachedPanel =
        !result.disqualified &&
        exitCeiling >= (stageByKey.get('shortlisted')?.sortOrder ?? 40) &&
        stageKey !== 'withdrawn' &&
        vacancy.panelUserIds.length >= 2

      // ---- Panel scores ----------------------------------------------------
      const panelRows: Array<{ criterionId: string; reviewerId: string; points: number; maxPoints: number; comment: string | null }> = []
      if (reachedPanel) {
        const manualCriteria = vacancy.criteria.filter((c) => c.type === 'MANUAL')
        const reviewers = rng.sample(vacancy.panelUserIds, rng.int(2, Math.min(3, vacancy.panelUserIds.length)))
        // One panel in six genuinely disagrees. Averaging that away is the thing
        // the disagreement flag exists to prevent, so the fixture has to contain it.
        const disagrees = rng.chance(0.16)

        for (const criterion of manualCriteria) {
          const rubric = (criterion.config?.rubric ?? []) as Array<{ label: string; points: number }>
          if (!rubric.length) continue
          for (const reviewerId of reviewers) {
            const centre = candidate.quality * 100
            const spread = disagrees ? 30 : 9
            const target = rng.normal(centre, spread, 0, 100)
            // Reviewers score against rubric levels, not a free scale.
            const level = rubric.reduce((best, r) =>
              Math.abs(r.points - target) < Math.abs(best.points - target) ? r : best, rubric[0]!)
            panelRows.push({
              criterionId: criterion.id,
              reviewerId,
              points: level.points,
              maxPoints: criterion.maxPoints,
              comment: rng.chance(0.55) ? `${level.label}. ${rng.pick([
                'Answers were specific and evidenced.',
                'Struggled to give concrete examples.',
                'Strong grasp of the statutory framework.',
                'Would need close supervision initially.',
                'Handled the scenario question well.'
              ])}` : null
            })
          }
        }

        if (panelRows.length) {
          const byCriterion: Record<string, number[]> = {}
          for (const r of panelRows) (byCriterion[r.criterionId] ??= []).push(r.points)
          result = scoreApplication(scoringInput(byCriterion))
        }
      }

      // Collapsed to one entry per reviewer first, exactly as the live scorer
      // does. Aggregating the raw per-criterion rows compares questions rather
      // than reviewers, and the fixture would then disagree with the app.
      const panelAggregate = panelRows.length
        ? aggregatePanelScores(
            collapseToReviewerEntries(
              panelRows.map((r) => ({
                reviewerId: r.reviewerId,
                criterionId: r.criterionId,
                points: r.points,
                maxPoints: r.maxPoints,
                isChair: r.reviewerId === vacancy.panelUserIds[0]
              }))
            ),
            'MEAN',
            20
          )
        : null

      const isWithdrawn = stageKey === 'withdrawn'
      const isShortlisted = ['shortlisted', 'interview', 'security_checks', 'reference_checks', 'offer'].includes(stageKey)

      const application = await prisma.jobApplication.create({
        data: {
          jobId: vacancy.id,
          candidateId: candidate.id!,
          referenceNumber: reference,
          mode: 'STRUCTURED',
          stageId: stage.id,
          status: (stage.legacyStatus ?? 'PENDING') as any,
          submittedAt,
          createdAt: submittedAt,

          name: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
          phone: candidate.phone,
          answers: answers as any,
          // What the vacancy's scheme looked like at submit time. A later scheme
          // edit can then be shown not to rewrite history.
          schemeSnapshot: {
            scoringVersion: 1,
            bucketWeights: vacancy.archetype.bucketWeights,
            keywords: vacancy.archetype.keywords,
            criteria: vacancy.criteria.map((c) => ({ key: c.key, type: c.type, weight: c.weight, maxPoints: c.maxPoints })),
            disqualifiers: vacancy.disqualifiers.map((d) => ({ key: d.key, type: d.type, action: d.action }))
          } as any,
          scoringVersion: 1,

          firstName: candidate.firstName,
          lastName: candidate.lastName,
          nationalIdType: 'National ID',
          nationalId: candidate.nationalId,
          dateOfBirth: candidate.dateOfBirth,
          gender: candidate.gender,
          nationality: 'Zimbabwean',
          hasDisability: candidate.hasDisability,
          province: candidate.province,
          city: candidate.city,
          altPhone: candidate.altPhone,
          howHeard: answers.position.howHeard,
          noticePeriodDays: answers.position.noticePeriodDays,
          willingToRelocate: answers.position.willingToRelocate,
          expectedSalary: answers.position.expectedSalary,
          totalYearsExperience: candidate.totalYears,
          isCurrentlyEmployed: candidate.isCurrentlyEmployed,
          highestQualification: (highestQualification(candidate.qualifications.map((q: any) => q.level)) ?? null) as any,
          driversLicenceClass: candidate.driversLicenceClass,

          autoScore: round1(result.total),
          finalScore: round1(result.total),
          keywordMatchPct: round1(result.keyword.percent),
          scoreComputedAt: addMinutes(submittedAt, rng.int(1, 6)),
          integrityFlagCount: result.flags.length,
          isAutoRejected: result.disqualified,
          autoRejectReasons: result.disqualified ? (result.disqualificationReasons as any) : undefined,
          isShortlisted,
          isWithdrawn,
          withdrawnAt: isWithdrawn ? addDays(submittedAt, rng.int(2, 25)) : null,
          withdrawnReason: isWithdrawn
            ? rng.pick(['Accepted another offer.', 'No longer available for this post.', 'Personal reasons.'])
            : null,
          panelReviewCount: panelAggregate?.count ?? 0,
          // Written unrounded, because aggregatePanelScores has already rounded to
          // 2dp and scoreAndPersist stores exactly that. Rounding again here would
          // make a rescore appear to change a number it had not changed.
          panelScoreMean: panelAggregate?.mean ?? null,
          panelScoreMedian: panelAggregate?.median ?? null,
          panelScoreSpread: panelAggregate?.spread ?? null,
          panelScoreStdev: panelAggregate?.stdev ?? null,

          qualifications: {
            create: candidate.qualifications.map((q: any) => ({
              level: q.level, fieldOfStudy: q.fieldOfStudy, institution: q.institution,
              country: q.country, yearObtained: q.yearObtained, classGrade: q.classGrade, result: q.result
            }))
          },
          employments: {
            create: candidate.employment.map((e: any, idx: number) => ({
              sortOrder: idx, employer: e.employer, jobTitle: e.jobTitle,
              fromMonth: e.fromMonth, toMonth: e.toMonth, isCurrent: e.isCurrent,
              salary: e.salary, responsibilities: e.responsibilities,
              reasonForLeaving: e.reasonForLeaving, noticePeriod: e.noticePeriod,
              supervisorName: e.supervisorName, supervisorRole: e.supervisorRole,
              supervisorPhone: e.supervisorPhone
            }))
          },
          declarations: {
            create: DECLARATIONS.map((d) => {
              const given = answers.declarations[d.key]!
              return {
                key: d.key,
                question: declarationQuestion(d.key),
                answer: given.answer,
                explanation: given.explanation ?? null,
                isAdverse: isAdverseDeclaration(d.key, given.answer)
              }
            })
          },
          skills: {
            create: [
              ...answers.skills.list.map((name) => ({ kind: 'software', name })),
              ...candidate.languages.map((l: any) => ({ kind: 'language', name: l.language, detail: l as any }))
            ]
          },
          documents: {
            create: answers.documents.map((d) => ({
              slotKey: d.slotKey,
              fileName: d.fileName,
              fileUrl: d.fileUrl,
              fileSize: d.fileSize ?? 100_000,
              fileType: d.fileName.split('.').pop() ?? 'pdf',
              // Verification states vary so the dossier's document tab is not a
              // wall of one badge.
              verification: rng.weighted([
                ['RECEIVED', 6], ['VERIFIED', 5], ['AWAITING_REFEREE', 1], ['ACTION_NEEDED', 1]
              ] as const) as any,
              uploadedAt: submittedAt
            }))
          },
          criterionScores: {
            create: result.criterionResults.map((r) => ({
              criterionId: r.criterionId,
              criterionKey: r.key,
              bucket: r.bucket as any,
              rawPoints: r.rawPoints,
              maxPoints: r.maxPoints,
              normalizedPct: r.normalizedPct,
              weightedPoints: r.weightedPoints,
              pending: r.pending,
              detail: r.detail as any,
              explanation: r.explanation
            }))
          },
          keywordHits: {
            create: [
              ...result.keyword.matched.map((m) => ({
                keyword: m.keyword, isRequired: m.isRequired, matched: true,
                occurrences: m.occurrences, matchedVia: m.matchedVia ?? null, source: m.source ?? null
              })),
              ...result.keyword.missed.map((m) => ({
                keyword: m.keyword, isRequired: m.isRequired, matched: false, occurrences: 0
              }))
            ]
          },
          flags: result.flags.length
            ? {
                create: result.flags.map((f) => ({
                  disqualifierId: f.disqualifierId ?? null,
                  code: f.key,
                  label: f.label,
                  severity: f.severity as any,
                  status: 'OPEN' as any,
                  causedReject: f.action === 'AUTO_REJECT',
                  detail: f.detail,
                  publicReason: f.publicReason ?? null,
                  createdAt: addMinutes(submittedAt, 3)
                }))
              }
            : undefined
        },
        select: { id: true }
      })

      // ---- Stage history ---------------------------------------------------
      // Walk the pipeline in order up to the final stage rather than jumping
      // straight to it, so the dossier's history tab reads like a real one.
      const path: Stage[] = [stageByKey.get('received')!]
      if (stageKey === 'auto_rejected') {
        path.push(stage)
      } else if (stageKey === 'withdrawn') {
        for (const s of stages) {
          if (s.key === 'received' || s.isRejection || s.key === 'withdrawn') continue
          if (s.sortOrder <= exitCeiling && rng.chance(0.8)) path.push(s)
        }
        path.push(stage)
      } else if (stageKey !== 'received') {
        for (const s of stages) {
          if (s.key === 'received' || s.isRejection || s.key === 'withdrawn') continue
          // <= the ceiling, so the exit stage itself is part of the history.
          if (s.sortOrder <= exitCeiling && rng.chance(0.85)) path.push(s)
        }
        if (path[path.length - 1]!.key !== stage.key) path.push(stage)
      }

      let cursor = submittedAt
      const reviewer = staff.length ? rng.pick(staff) : null
      for (const [idx, s] of path.entries()) {
        const automated = idx === 0 || s.key === 'auto_rejected'
        await prisma.applicationStageEvent.create({
          data: {
            applicationId: application.id,
            stageId: s.id,
            fromStageKey: idx > 0 ? path[idx - 1]!.key : null,
            toStageKey: s.key,
            toInternalLabel: s.internalLabel,
            toPublicLabel: s.publicLabel,
            isAutomated: automated,
            changedBy: automated ? null : reviewer?.id ?? null,
            changedByName: automated ? null : reviewer?.name ?? reviewer?.email ?? null,
            note:
              idx === 0 ? 'Application submitted'
                : s.key === 'auto_rejected' ? result.disqualificationReasons.map((r) => r.label).join('; ')
                : s.key === 'withdrawn' ? 'Withdrawn by the candidate'
                : null,
            createdAt: cursor
          }
        })
        cursor = addDays(cursor, rng.int(1, 9))
        if (cursor > NOW) cursor = addMinutes(NOW, -rng.int(10, 600))
      }

      // ---- Panel score rows -----------------------------------------------
      if (panelRows.length) {
        await prisma.applicationPanelScore.createMany({
          data: panelRows.map((r) => ({
            applicationId: application.id,
            criterionId: r.criterionId,
            reviewerId: r.reviewerId,
            points: r.points,
            maxPoints: r.maxPoints,
            comment: r.comment,
            isSubmitted: true,
            submittedAt: cursor
          }))
        })
        // One overall verdict per reviewer, separate from the per-criterion scores.
        const reviewerIds = [...new Set(panelRows.map((r) => r.reviewerId))]
        await prisma.applicationReview.createMany({
          data: reviewerIds.map((reviewerId, idx) => ({
            applicationId: application.id,
            reviewerId,
            role: (idx === 0 ? 'CHAIR' : 'MEMBER') as any,
            recommendation:
              result.total >= 70 ? 'SHORTLIST' : result.total >= 55 ? 'RESERVE' : 'REJECT',
            comments: rng.chance(0.5)
              ? rng.pick([
                  'Recommend progressing to interview.',
                  'Solid on paper; verify the referee before any offer.',
                  'Below the standard required for this grade.',
                  'Strong candidate — would appoint.'
                ])
              : null,
            isSubmitted: true,
            submittedAt: cursor
          }))
        })
        stats.panelReviewed++
      }

      // ---- Notifications ---------------------------------------------------
      // The point of this block: a rejection that is still queued must NOT be
      // visible to the candidate. Seeding both the held and the delivered case
      // is what makes that testable without waiting two days.
      if (stage.isRejection && stage.notifyCandidate) {
        // Falls back to the generic rejection template when the stage has none
        // attached, so the held-rejection case still has an outbox row to hold.
        const fallbackKey = stage.key === 'auto_rejected' ? 'application.auto_rejected' : 'application.rejected'
        const template = stage.notificationTemplate ?? templateByKey.get(fallbackKey) ?? null
        const held = rng.chance(0.35)
        const delay = stage.notificationDelayMinutes + rng.int(0, stage.notificationDelayJitterMinutes || 1)
        const scheduledFor = held
          ? addMinutes(NOW, rng.int(60, 60 * 40))
          : addMinutes(cursor, delay)

        await prisma.emailOutbox.create({
          data: {
            templateId: template?.id ?? null,
            templateKey: template?.key ?? fallbackKey,
            toEmail: candidate.email,
            toName: candidate.firstName,
            subject: template?.subject ?? 'Update on your application to the Commission',
            bodyHtml:
              template?.bodyHtml ??
              `<p>Dear ${candidate.firstName},</p><p>Thank you for your interest in the post of ` +
              `${vacancy.title} (${reference}). Your application was not taken forward on this occasion.</p>`,
            bodyText:
              template?.bodyText ??
              `Dear ${candidate.firstName}, your application ${reference} was not taken forward on this occasion.`,
            status: held ? 'SCHEDULED' : 'SENT',
            scheduledFor,
            sentAt: held ? null : scheduledFor,
            contextType: 'application',
            contextId: application.id,
            variables: {
              firstName: candidate.firstName,
              reference,
              jobTitle: vacancy.title
            } as any,
            createdAt: cursor
          }
        })
        if (held) stats.heldRejections++
        else stats.sentNotices++
      }

      stats.total++
      stats.structured++
      if (result.disqualified) stats.autoRejected++
      if (isWithdrawn) stats.withdrawn++
      if (isShortlisted) stats.shortlisted++
      stats.byStage.set(stageKey, (stats.byStage.get(stageKey) ?? 0) + 1)
    }

    // Keep the denormalised counter honest — the console and the vacancies list
    // both read it, and a counter that disagrees with the rows is a bug report.
    for (const v of vacancies) {
      const count = await prisma.jobApplication.count({ where: { jobId: v.id } })
      if (count) await prisma.job.update({ where: { id: v.id }, data: { applicationCount: count } })
    }

    // =======================================================================
    // Summary
    // =======================================================================
    console.log(`   ✓ ${stats.total} applications (${stats.structured} screened, ${stats.legacy} legacy)\n`)
    console.log('📊 Distribution across the pipeline')
    for (const s of stages) {
      const n = stats.byStage.get(s.key) ?? 0
      const bar = '█'.repeat(Math.min(40, Math.round(n / 2)))
      console.log(`   ${s.internalLabel.padEnd(26)} ${String(n).padStart(4)}  ${bar}`)
    }

    console.log('\n🔎 Worth knowing')
    console.log(`   Auto-rejected by a rule       ${stats.autoRejected}`)
    console.log(`   Withdrawn by the candidate    ${stats.withdrawn}`)
    console.log(`   Shortlisted or beyond         ${stats.shortlisted}`)
    console.log(`   With submitted panel scores   ${stats.panelReviewed}`)
    console.log(`   Rejections still QUEUED       ${stats.heldRejections}   ← these candidates must still see "Under review"`)
    console.log(`   Rejections already sent       ${stats.sentNotices}`)

    console.log('\n🔑 Sign in as any candidate')
    console.log(`   ${candidates[0]!.email}`)
    console.log(`   ${candidates[1]!.email}`)
    console.log(`   password: ${DEMO_PASSWORD}`)

    console.log('\n✅ Demo seed complete. Re-run with --reset to rebuild.\n')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('\n❌ Demo seed failed:', e)
  process.exit(1)
})
