import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  describeCriterion,
  criterionCeiling,
  bandChips,
  isDemographicField,
  isDemographicCriterion
} from '../shared/recruitment/describe'

const banded = {
  label: 'Years of relevant experience',
  type: 'BANDED',
  maxPoints: 100,
  sourceField: 'employment.totalYears',
  config: {
    kind: 'BANDED',
    unit: 'experience',
    bands: [
      { label: '0-2 years', min: 0, max: 2, points: 20 },
      { label: '3-4 years', min: 3, max: 4, points: 50 },
      { label: '5+ years', min: 5, max: null, points: 100 }
    ]
  }
}

test('a banded criterion is described with its tier count and best award', () => {
  const s = describeCriterion(banded)
  assert.match(s, /3 tier\(s\)/)
  assert.match(s, /best of 100 out of 100/)
})

test('the open-ended top band reads as "and above", not as a range', () => {
  assert.deepEqual(bandChips(banded), ['0–2 → +20', '3–4 → +50', '5+ → +100'])
})

test('a criterion with no label is not described at all', () => {
  // The builder uses the empty string as its "not ready to preview" signal.
  assert.equal(describeCriterion({ ...banded, label: '  ' }), '')
})

test('a banded criterion with no bands yet is not described', () => {
  assert.equal(describeCriterion({ ...banded, config: { kind: 'BANDED', bands: [] } }), '')
})

test('the ceiling comes from the bands, not from maxPoints', () => {
  // maxPoints is the normalisation denominator; it is not what the rule awards.
  const capped = { ...banded, maxPoints: 100, config: { ...banded.config, bands: banded.config.bands.slice(0, 2) } }
  assert.equal(criterionCeiling(capped), 50)
})

test('a keyword criterion counts both keyword sets', () => {
  const s = describeCriterion({
    label: 'Investigation skills',
    type: 'KEYWORD',
    maxPoints: 40,
    config: { kind: 'KEYWORD', required: ['forensic', 'audit'], preferred: ['ACFE'] }
  })
  assert.match(s, /2 required and 1 preferred/)
  assert.match(s, /40 points/)
})

test('a keyword criterion with no keywords is not described', () => {
  assert.equal(
    describeCriterion({ label: 'Skills', type: 'KEYWORD', config: { kind: 'KEYWORD', required: [], preferred: [] } }),
    ''
  )
})

test('a manual criterion says it is excluded until reviewers submit', () => {
  const s = describeCriterion({
    label: 'Interview performance',
    type: 'MANUAL',
    config: { kind: 'MANUAL', rubric: [{ label: 'Weak', points: 10 }, { label: 'Strong', points: 60 }] }
  })
  assert.match(s, /2 rubric level\(s\)/)
  assert.match(s, /up to 60 points/)
  assert.match(s, /Excluded from the total/)
})

test('a qualification ladder is described by its top rung', () => {
  const s = describeCriterion({
    label: 'Highest qualification',
    type: 'QUALIFICATION_LADDER',
    config: {
      kind: 'QUALIFICATION_LADDER',
      ladder: [
        { level: 'DIPLOMA', points: 20 },
        { level: 'DOCTORATE', points: 100 },
        { level: 'DEGREE', points: 60 }
      ]
    }
  })
  // The top rung is the highest-scoring one, not the last one listed.
  assert.match(s, /up to 100 for /)
})

test('a boolean criterion states both outcomes', () => {
  const s = describeCriterion({
    label: 'Consents to vetting',
    type: 'BOOLEAN',
    config: { kind: 'BOOLEAN', truePoints: 100, falsePoints: 0 }
  })
  assert.equal(s, 'Awards 100 points for yes and 0 for no.')
})

test('a boolean ceiling takes whichever answer scores higher', () => {
  // Inverted rules are legitimate: refusing vetting is the adverse answer.
  assert.equal(
    criterionCeiling({ type: 'BOOLEAN', config: { kind: 'BOOLEAN', truePoints: 0, falsePoints: 80 } }),
    80
  )
})

test('demographic source fields are recognised', () => {
  assert.equal(isDemographicField('personal.gender'), true)
  assert.equal(isDemographicField('personal.dateOfBirth'), true)
  assert.equal(isDemographicField('employment.totalYears'), false)
  assert.equal(isDemographicField(null), false)
})

test('a manual criterion titled after a protected characteristic still warns', () => {
  // It has no source field, so the field check alone would miss it entirely.
  assert.equal(isDemographicCriterion({ label: 'Age suitability', type: 'MANUAL' }), true)
  assert.equal(isDemographicCriterion({ label: 'Gender', type: 'MANUAL' }), true)
})

test('a word that merely contains a protected term does not warn', () => {
  // "management" contains "age"; a substring check would fire on most vacancies.
  assert.equal(isDemographicCriterion({ label: 'Management experience', type: 'MANUAL' }), false)
  assert.equal(isDemographicCriterion({ label: 'Racecourse operations', type: 'MANUAL' }), false)
})
