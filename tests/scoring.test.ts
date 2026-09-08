import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreApplication, ageAt, readPath } from '../shared/recruitment/scoring'
import type {
  CriterionDef,
  DisqualifierDef,
  ScorableApplication,
  ScoringInput
} from '../shared/recruitment/types'

// --- fixtures --------------------------------------------------------------

function app(overrides: Partial<ScorableApplication> = {}): ScorableApplication {
  return {
    personal: { dateOfBirth: '1990-01-01', gender: 'Female', province: 'Harare' },
    position: { jobId: 'job1', noticePeriodDays: 30, willingToRelocate: true },
    qualifications: [{ level: 'FIRST_DEGREE' }],
    memberships: [],
    employment: { totalYears: 6, isCurrentlyEmployed: true, positions: [] },
    declarations: {},
    skills: { raw: '', list: [] },
    languages: [],
    documents: [],
    ...overrides
  }
}

function criterion(over: Partial<CriterionDef> & Pick<CriterionDef, 'id' | 'key' | 'config'>): CriterionDef {
  return {
    label: over.key,
    bucket: 'QUALIFICATIONS_EXPERIENCE',
    type: 'BANDED',
    weight: 1,
    maxPoints: 100,
    isAutoScored: true,
    isPanelScored: false,
    showToCandidate: true,
    sortOrder: 0,
    ...over
  } as CriterionDef
}

function input(over: Partial<ScoringInput> = {}): ScoringInput {
  return {
    vacancy: { id: 'job1', bucketWeights: { QUALIFICATIONS_EXPERIENCE: 100 }, closingDate: '2026-12-31' },
    criteria: [],
    disqualifiers: [],
    application: app(),
    now: '2026-08-27T00:00:00.000Z',
    ...over
  }
}

// --- BANDED ----------------------------------------------------------------

test('BANDED picks the matching band, inclusive at both edges', () => {
  const bands = [
    { label: '0-2 years', min: 0, max: 2, points: 20 },
    { label: '3-4 years', min: 3, max: 4, points: 50 },
    { label: '5-10 years', min: 5, max: 10, points: 80 },
    { label: '10+ years', min: 10, max: null, points: 100 }
  ]
  const c = criterion({
    id: 'c1', key: 'years', type: 'BANDED',
    sourceField: 'employment.totalYears',
    config: { kind: 'BANDED', bands, unit: 'years' }
  })

  const at6 = scoreApplication(input({ criteria: [c] }))
  assert.equal(at6.total, 80)
  assert.equal(at6.criterionResults[0]?.detail.band, '5-10 years')

  // Lower edge of a band is inclusive.
  const at5 = scoreApplication(input({ criteria: [c], application: app({ employment: { totalYears: 5, positions: [] } }) }))
  assert.equal(at5.total, 80)

  // Unbounded upper band.
  const at30 = scoreApplication(input({ criteria: [c], application: app({ employment: { totalYears: 30, positions: [] } }) }))
  assert.equal(at30.total, 100)
})

test('BANDED with no value scores zero and says so, rather than failing', () => {
  const c = criterion({
    id: 'c1', key: 'years', type: 'BANDED',
    sourceField: 'employment.totalYears',
    config: { kind: 'BANDED', bands: [{ label: 'any', min: 0, max: null, points: 100 }] }
  })
  const r = scoreApplication(input({ criteria: [c], application: app({ employment: { positions: [] } }) }))
  assert.equal(r.total, 0)
  assert.equal(r.criterionResults[0]?.explanation, 'Not provided')
})

// --- QUALIFICATION_LADDER --------------------------------------------------

test('QUALIFICATION_LADDER uses the highest attained level', () => {
  const c = criterion({
    id: 'c1', key: 'quals', type: 'QUALIFICATION_LADDER',
    config: { kind: 'QUALIFICATION_LADDER' }
  })
  const r = scoreApplication(input({
    criteria: [c],
    application: app({ qualifications: [{ level: 'O_LEVEL' }, { level: 'MASTERS' }, { level: 'A_LEVEL' }] })
  }))
  assert.equal(r.total, 90) // MASTERS
  assert.equal(r.criterionResults[0]?.detail.highest, 'MASTERS')
})

test('QUALIFICATION_LADDER honours a per-vacancy override', () => {
  const c = criterion({
    id: 'c1', key: 'quals', type: 'QUALIFICATION_LADDER',
    config: { kind: 'QUALIFICATION_LADDER', ladder: [{ level: 'FIRST_DEGREE', points: 40 }] }
  })
  const r = scoreApplication(input({ criteria: [c] }))
  assert.equal(r.total, 40, 'override must beat the default 72')
})

// --- KEYWORD ---------------------------------------------------------------

test('KEYWORD scores proportionally to the match', () => {
  const c = criterion({
    id: 'c1', key: 'kw', type: 'KEYWORD', bucket: 'SKILLS',
    config: { kind: 'KEYWORD', required: ['audit', 'forensic'], preferred: [] }
  })
  const r = scoreApplication(input({
    vacancy: { id: 'job1', bucketWeights: { SKILLS: 100 } },
    criteria: [c],
    application: app({ skills: { raw: 'audit, excel', list: [] } })
  }))
  assert.equal(r.total, 50, 'one of two required keywords')
})

// --- BOOLEAN / CHOICE ------------------------------------------------------

test('BOOLEAN and CHOICE map values to points', () => {
  const b = criterion({
    id: 'c1', key: 'relocate', type: 'BOOLEAN', bucket: 'FIT', maxPoints: 100,
    sourceField: 'position.willingToRelocate',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 25 }
  })
  const yes = scoreApplication(input({ vacancy: { id: 'job1', bucketWeights: { FIT: 100 } }, criteria: [b] }))
  assert.equal(yes.total, 100)

  const c = criterion({
    id: 'c2', key: 'heard', type: 'CHOICE', bucket: 'FIT', maxPoints: 100,
    sourceField: 'position.howHeard',
    config: { kind: 'CHOICE', map: { 'Employee Referral': 100 }, defaultPoints: 10 }
  })
  const referral = scoreApplication(input({
    vacancy: { id: 'job1', bucketWeights: { FIT: 100 } },
    criteria: [c],
    application: app({ position: { jobId: 'job1', howHeard: 'Employee Referral' } })
  }))
  assert.equal(referral.total, 100)

  const other = scoreApplication(input({
    vacancy: { id: 'job1', bucketWeights: { FIT: 100 } },
    criteria: [c],
    application: app({ position: { jobId: 'job1', howHeard: 'Print Media' } })
  }))
  assert.equal(other.total, 10, 'falls back to defaultPoints')
})

// --- weighting -------------------------------------------------------------

test('bucket weights sum to 100 and each bucket contributes its share', () => {
  const quals = criterion({
    id: 'c1', key: 'quals', type: 'QUALIFICATION_LADDER',
    bucket: 'QUALIFICATIONS_EXPERIENCE',
    config: { kind: 'QUALIFICATION_LADDER', ladder: [{ level: 'FIRST_DEGREE', points: 100 }] }
  })
  const kw = criterion({
    id: 'c2', key: 'kw', type: 'KEYWORD', bucket: 'SKILLS',
    config: { kind: 'KEYWORD', required: ['audit'], preferred: [] }
  })
  const r = scoreApplication(input({
    vacancy: { id: 'job1', bucketWeights: { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10 } },
    criteria: [quals, kw],
    application: app({ skills: { raw: 'audit', list: [] } })
  }))
  // Full marks in both populated buckets = 40 + 30. Empty buckets contribute 0.
  assert.equal(r.total, 70)
  const byBucket = Object.fromEntries(r.bucketScores.map((b) => [b.bucket, b.earned]))
  assert.equal(byBucket.QUALIFICATIONS_EXPERIENCE, 40)
  assert.equal(byBucket.SKILLS, 30)
  assert.equal(byBucket.INTEGRITY, 0)
})

test('relative weights split a bucket proportionally', () => {
  const heavy = criterion({
    id: 'c1', key: 'heavy', weight: 3, type: 'BOOLEAN', sourceField: 'a',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  })
  const light = criterion({
    id: 'c2', key: 'light', weight: 1, type: 'BOOLEAN', sourceField: 'b',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  })
  // Only the heavy one is satisfied -> 3/4 of the bucket.
  const r = scoreApplication(input({
    criteria: [heavy, light],
    application: { ...app(), a: true, b: false } as any
  }))
  assert.equal(r.total, 75)
})

test('zero total weight does not divide by zero', () => {
  const c = criterion({
    id: 'c1', key: 'z', weight: 0, type: 'BOOLEAN', sourceField: 'position.willingToRelocate',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  })
  const r = scoreApplication(input({ criteria: [c] }))
  assert.ok(Number.isFinite(r.total))
  assert.equal(r.total, 0)
})

test('an empty criteria list yields zero, not NaN', () => {
  const r = scoreApplication(input({ criteria: [] }))
  assert.equal(r.total, 0)
  assert.equal(r.criterionResults.length, 0)
})

// --- MANUAL / pending ------------------------------------------------------

test('pending MANUAL criteria are excluded from the denominator, not scored zero', () => {
  const auto = criterion({
    id: 'c1', key: 'auto', weight: 1, type: 'BOOLEAN',
    sourceField: 'position.willingToRelocate',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  })
  const manual = criterion({
    id: 'c2', key: 'interview', weight: 1, type: 'MANUAL', isAutoScored: false, isPanelScored: true,
    config: { kind: 'MANUAL', rubric: [{ label: 'Weak', points: 20 }, { label: 'Strong', points: 80 }] }
  })

  // No panel input yet: the resolved criterion carries the whole bucket, so a
  // strong candidate is not punished for the panel not having met.
  const before = scoreApplication(input({ criteria: [auto, manual] }))
  assert.equal(before.total, 100)
  assert.deepEqual(before.manualPending, ['interview'])

  // Once scored, the two split the bucket evenly.
  const after = scoreApplication(input({
    criteria: [auto, manual],
    panel: { scoresByCriterion: { c2: [50] }, aggregation: 'MEAN', spreadThreshold: 20 }
  }))
  assert.equal(after.total, 75)
  assert.deepEqual(after.manualPending, [])
})

test('MANUAL averages multiple reviewer scores', () => {
  const manual = criterion({
    id: 'c2', key: 'interview', type: 'MANUAL',
    config: { kind: 'MANUAL', rubric: [] }
  })
  const r = scoreApplication(input({
    criteria: [manual],
    panel: { scoresByCriterion: { c2: [60, 80, 70] }, aggregation: 'MEAN', spreadThreshold: 20 }
  }))
  assert.equal(r.total, 70)
  assert.equal(r.criterionResults[0]?.detail.reviewerCount, 3)
})

// --- disqualifiers ---------------------------------------------------------

const adverseCorruption: DisqualifierDef = {
  id: 'd1',
  key: 'corruption',
  label: 'Under corruption investigation',
  type: 'REQUIRED_FALSE',
  sourceField: 'declarations.corruption.answer',
  config: { detail: 'Adverse corruption declaration' },
  action: 'AUTO_REJECT',
  severity: 'CRITICAL',
  publicReason: 'Your application could not be progressed at this time.',
  internalReason: 'Adverse corruption declaration'
}

test('an adverse declaration disqualifies but does NOT zero the score', () => {
  const c = criterion({
    id: 'c1', key: 'quals', type: 'QUALIFICATION_LADDER',
    config: { kind: 'QUALIFICATION_LADDER' }
  })
  const r = scoreApplication(input({
    criteria: [c],
    disqualifiers: [adverseCorruption],
    application: app({ declarations: { corruption: { answer: true } } })
  }))
  assert.equal(r.disqualified, true)
  assert.equal(r.disqualificationReasons.length, 1)
  // HR still needs the numbers for reporting on who was auto-rejected.
  assert.equal(r.total, 72)
})

test('a clean declaration does not raise a flag', () => {
  const r = scoreApplication(input({
    disqualifiers: [adverseCorruption],
    application: app({ declarations: { corruption: { answer: false } } })
  }))
  assert.equal(r.disqualified, false)
  assert.deepEqual(r.flags, [])
})

test('FLAG_ONLY raises a flag without disqualifying', () => {
  const flagOnly: DisqualifierDef = { ...adverseCorruption, id: 'd2', key: 'criminal', action: 'FLAG_ONLY', severity: 'MEDIUM' }
  const r = scoreApplication(input({
    disqualifiers: [flagOnly],
    application: app({ declarations: { corruption: { answer: true } } })
  }))
  assert.equal(r.flags.length, 1)
  assert.equal(r.disqualified, false)
})

test('MIN_NUMERIC enforces a minimum-experience bar', () => {
  const d: DisqualifierDef = {
    id: 'd3', key: 'min_exp', label: 'Minimum experience', type: 'MIN_NUMERIC',
    sourceField: 'employment.totalYears', config: { value: 5 },
    action: 'AUTO_REJECT', severity: 'HIGH'
  }
  assert.equal(scoreApplication(input({ disqualifiers: [d] })).disqualified, false, '6 years passes')
  const under = scoreApplication(input({
    disqualifiers: [d],
    application: app({ employment: { totalYears: 3, positions: [] } })
  }))
  assert.equal(under.disqualified, true)
})

test('REQUIRED_QUALIFICATION compares by ladder rank', () => {
  const d: DisqualifierDef = {
    id: 'd4', key: 'min_qual', label: 'Degree required', type: 'REQUIRED_QUALIFICATION',
    config: { level: 'FIRST_DEGREE' }, action: 'AUTO_REJECT', severity: 'HIGH'
  }
  assert.equal(scoreApplication(input({ disqualifiers: [d] })).disqualified, false)
  const diplomaOnly = scoreApplication(input({
    disqualifiers: [d],
    application: app({ qualifications: [{ level: 'DIPLOMA' }] })
  }))
  assert.equal(diplomaOnly.disqualified, true)
})

test('MISSING_DOCUMENT names the missing slots', () => {
  const d: DisqualifierDef = {
    id: 'd5', key: 'docs', label: 'Required documents', type: 'MISSING_DOCUMENT',
    config: { slotKeys: ['cv', 'certificates'] }, action: 'AUTO_REJECT', severity: 'HIGH'
  }
  const r = scoreApplication(input({
    disqualifiers: [d],
    application: app({ documents: [{ slotKey: 'cv', fileName: 'cv.pdf' }] })
  }))
  assert.equal(r.disqualified, true)
  assert.match(r.disqualificationReasons[0]!.detail, /certificates/)
})

test('AGE_RANGE uses the injected clock so the test is deterministic', () => {
  const d: DisqualifierDef = {
    id: 'd6', key: 'age', label: 'Age range', type: 'AGE_RANGE',
    config: { min: 18, max: 35 }, action: 'FLAG_ONLY', severity: 'LOW'
  }
  // Born 1990, evaluated 2026 -> 36, above the max.
  const r = scoreApplication(input({ disqualifiers: [d] }))
  assert.equal(r.flags.length, 1)
  assert.match(r.flags[0]!.detail, /36/)
})

test('CLOSING_DATE flags a late submission', () => {
  const d: DisqualifierDef = {
    id: 'd7', key: 'closed', label: 'Closed', type: 'CLOSING_DATE',
    config: {}, action: 'AUTO_REJECT', severity: 'HIGH'
  }
  const late = scoreApplication(input({
    disqualifiers: [d],
    vacancy: { id: 'job1', bucketWeights: {}, closingDate: '2026-01-01' }
  }))
  assert.equal(late.disqualified, true)
})

// --- documents & misc ------------------------------------------------------

test('missing mandatory documents are reported separately from flags', () => {
  const r = scoreApplication(input({
    vacancy: {
      id: 'job1', bucketWeights: {},
      documentSlots: [
        { key: 'cv', label: 'CV', isMandatory: true },
        { key: 'photo', label: 'Photo', isMandatory: true },
        { key: 'licence', label: 'Licence', isMandatory: false }
      ]
    },
    application: app({ documents: [{ slotKey: 'cv', fileName: 'cv.pdf' }] })
  }))
  assert.deepEqual(r.missingMandatoryDocuments, ['photo'])
})

test('readPath and ageAt handle absent and malformed input', () => {
  assert.equal(readPath({ a: { b: 1 } }, 'a.b'), 1)
  assert.equal(readPath({ a: null }, 'a.b.c'), undefined)
  assert.equal(readPath({}, undefined), undefined)
  assert.equal(ageAt('not-a-date'), null)
  assert.equal(ageAt('2000-06-15', '2026-06-14T00:00:00Z'), 25, 'day before the birthday')
  assert.equal(ageAt('2000-06-15', '2026-06-15T00:00:00Z'), 26, 'on the birthday')
})

test('the total never exceeds 100 for a fully satisfied scheme', () => {
  const mk = (id: string, bucket: any) => criterion({
    id, key: id, bucket, type: 'BOOLEAN', sourceField: 'position.willingToRelocate',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  })
  const r = scoreApplication(input({
    vacancy: { id: 'job1', bucketWeights: { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10 } },
    criteria: [mk('a', 'QUALIFICATIONS_EXPERIENCE'), mk('b', 'SKILLS'), mk('c', 'INTEGRITY'), mk('d', 'FIT')]
  }))
  assert.equal(r.total, 100)
})
