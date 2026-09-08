import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectApplication } from '../server/utils/applicationProjection'

const application = {
  id: 'clx123456789abcdef',
  referenceNumber: 'ZACC-APP-2026-00318',
  firstName: 'Tariro',
  lastName: 'Chikafu',
  email: 't.chikafu@example.com',
  phone: '+263771234567',
  gender: 'Female',
  dateOfBirth: new Date('1990-01-01'),
  hasDisability: false,
  province: 'Harare',
  totalYearsExperience: 6,
  finalScore: 82,
  panelScoreMean: 71,
  panelScoreSpread: 18,
  notes: 'Internal note',
  answers: {
    personal: { gender: 'Female', dateOfBirth: '1990-01-01', hasDisability: false, province: 'Harare' },
    employment: { totalYears: 6 }
  },
  stage: { key: 'security_checks', internalLabel: 'Security checks', publicLabel: 'Under review', colorHex: '#B54708' }
}

test('an admin sees everything', () => {
  const out = projectApplication(application, { kind: 'admin' }) as any
  assert.equal(out.gender, 'Female')
  assert.equal(out.finalScore, 82)
  assert.equal(out.stage.internalLabel, 'Security checks')
})

test('a panel member without demographics cannot see them at all', () => {
  const out = projectApplication(application, {
    kind: 'panel', userId: 'u1',
    canSeeIdentity: true, canSeeDemographics: false, canSeeOtherScores: true
  }) as any

  // Absent, not merely falsy — the key must not reach the browser.
  assert.equal('gender' in out, false)
  assert.equal('dateOfBirth' in out, false)
  assert.equal('hasDisability' in out, false)
  assert.ok(out.masked.includes('demographics'))

  // The raw wizard payload carries the same fields and must be scrubbed too,
  // or the masking is cosmetic.
  assert.equal('gender' in out.answers.personal, false)
  assert.equal('dateOfBirth' in out.answers.personal, false)
  // Non-protected answers survive.
  assert.equal(out.answers.employment.totalYears, 6)

  // Identity was allowed, so it stays.
  assert.equal(out.firstName, 'Tariro')
})

test('a blind panel member cannot see identity but gets a stable label', () => {
  const out = projectApplication(application, {
    kind: 'panel', userId: 'u1',
    canSeeIdentity: false, canSeeDemographics: false, canSeeOtherScores: false
  }) as any

  assert.equal('firstName' in out, false)
  assert.equal('email' in out, false)
  assert.equal('referenceNumber' in out, false)
  assert.equal(out.displayLabel, 'Candidate ABCDEF')
  assert.ok(out.masked.includes('identity'))
})

test("other reviewers' scores are withheld until permitted", () => {
  const hidden = projectApplication(application, {
    kind: 'panel', userId: 'u1',
    canSeeIdentity: true, canSeeDemographics: true, canSeeOtherScores: false
  }) as any
  assert.equal('panelScoreMean' in hidden, false)
  assert.equal('panelScoreSpread' in hidden, false)
  assert.ok(hidden.masked.includes('otherScores'))

  const shown = projectApplication(application, {
    kind: 'panel', userId: 'u1',
    canSeeIdentity: true, canSeeDemographics: true, canSeeOtherScores: true
  }) as any
  assert.equal(shown.panelScoreMean, 71)
})

test('a candidate sees the public stage label and no internal assessment', () => {
  const out = projectApplication(application, { kind: 'candidate', candidateId: 'c1' }) as any

  assert.equal(out.stage.publicLabel, 'Under review')
  // The whole point of the mapping: the internal name must never leak.
  assert.equal('internalLabel' in out.stage, false)

  assert.equal('finalScore' in out, false)
  assert.equal('panelScoreMean' in out, false)
  assert.equal('notes' in out, false)
  assert.equal('keywordMatchPct' in out, false)

  // Their own details remain theirs to see.
  assert.equal(out.firstName, 'Tariro')
})

test('projection does not mutate the original record', () => {
  const before = JSON.stringify(application)
  projectApplication(application, {
    kind: 'panel', userId: 'u1',
    canSeeIdentity: false, canSeeDemographics: false, canSeeOtherScores: false
  })
  assert.equal(JSON.stringify(application), before)
})
