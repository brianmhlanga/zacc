import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  criterionSchema,
  bucketWeightsSchema,
  vacancySchemeSchema
} from '../shared/recruitment/schemas'

const bandedCriterion = {
  key: 'years_experience',
  label: 'Years of relevant experience',
  bucket: 'QUALIFICATIONS_EXPERIENCE',
  type: 'BANDED',
  weight: 1,
  maxPoints: 100,
  sourceField: 'employment.totalYears',
  isAutoScored: true,
  isPanelScored: false,
  showToCandidate: true,
  sortOrder: 1,
  config: {
    kind: 'BANDED',
    bands: [
      { label: '0-4 years', min: 0, max: 4, points: 30 },
      { label: '5-10 years', min: 5, max: 10, points: 80 }
    ]
  }
}

test('accepts a well-formed banded criterion', () => {
  assert.equal(criterionSchema.safeParse(bandedCriterion).success, true)
})

test('rejects a criterion whose config does not match its type', () => {
  // The failure this guards against is silent: scoring would fall through to
  // zero for every applicant rather than erroring.
  const r = criterionSchema.safeParse({ ...bandedCriterion, type: 'KEYWORD' })
  assert.equal(r.success, false)
  assert.match(r.error!.issues[0]!.message, /Configuration is for a BANDED criterion but the type is KEYWORD/)
})

test('rejects a manual criterion marked auto-scored', () => {
  const r = criterionSchema.safeParse({
    ...bandedCriterion,
    type: 'MANUAL',
    isAutoScored: true,
    config: { kind: 'MANUAL', rubric: [{ label: 'Strong', points: 80 }] }
  })
  assert.equal(r.success, false)
  assert.ok(r.error!.issues.some((i) => /cannot be auto-scored/.test(i.message)))
})

test('rejects a manual criterion with no rubric', () => {
  const r = criterionSchema.safeParse({
    ...bandedCriterion, type: 'MANUAL', isAutoScored: false, isPanelScored: true,
    config: { kind: 'MANUAL', rubric: [] }
  })
  assert.equal(r.success, false)
})

test('requires a source field for value-reading criteria', () => {
  const r = criterionSchema.safeParse({ ...bandedCriterion, sourceField: null })
  assert.equal(r.success, false)
  assert.ok(r.error!.issues.some((i) => /needs a source field/.test(i.message)))
})

test('rejects a criterion key that is not a safe slug', () => {
  assert.equal(criterionSchema.safeParse({ ...bandedCriterion, key: 'Years Experience' }).success, false)
})

test('bucket weights must total 100', () => {
  assert.equal(bucketWeightsSchema.safeParse({
    QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10
  }).success, true)

  const r = bucketWeightsSchema.safeParse({
    QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 5
  })
  assert.equal(r.success, false)
  assert.match(r.error!.issues[0]!.message, /add up to 100/)
})

test('rejects duplicate criterion keys', () => {
  const r = vacancySchemeSchema.safeParse({
    criteria: [bandedCriterion, { ...bandedCriterion, sortOrder: 2 }]
  })
  assert.equal(r.success, false)
  assert.ok(r.error!.issues.some((i) => /Duplicate criterion key/.test(i.message)))
})

test('flags a weighted bucket that has no criteria', () => {
  // Otherwise that share of the score is silently unreachable and no
  // application can ever total 100.
  const r = vacancySchemeSchema.safeParse({
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10 },
    criteria: [bandedCriterion]
  })
  assert.equal(r.success, false)
  const messages = r.error!.issues.map((i) => i.message).join(' | ')
  assert.match(messages, /SKILLS.*30%.*no criteria/)
  assert.match(messages, /INTEGRITY/)
  assert.match(messages, /FIT/)
})

test('accepts a complete scheme covering every weighted bucket', () => {
  const r = vacancySchemeSchema.safeParse({
    bucketWeights: { QUALIFICATIONS_EXPERIENCE: 40, SKILLS: 30, INTEGRITY: 20, FIT: 10 },
    criteria: [
      bandedCriterion,
      {
        ...bandedCriterion, key: 'skills_match', bucket: 'SKILLS', type: 'KEYWORD',
        sourceField: null, sortOrder: 2,
        config: { kind: 'KEYWORD', required: ['fraud'], preferred: ['excel'] }
      },
      {
        ...bandedCriterion, key: 'vetting', bucket: 'INTEGRITY', type: 'BOOLEAN',
        sourceField: 'declarations.vetting.answer', sortOrder: 3,
        config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
      },
      {
        ...bandedCriterion, key: 'interview', bucket: 'FIT', type: 'MANUAL',
        sourceField: null, isAutoScored: false, isPanelScored: true, sortOrder: 4,
        config: { kind: 'MANUAL', rubric: [{ label: 'Strong', points: 80 }] }
      }
    ]
  })
  assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error?.issues))
})
