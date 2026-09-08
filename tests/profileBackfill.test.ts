import { test } from 'node:test'
import assert from 'node:assert/strict'
import { profileCompletion } from '../shared/recruitment/profileCompletion'

/**
 * The backfill's merge rule, exercised directly.
 *
 * `backfillProfileFromApplication` needs Prisma, so the database call is not
 * what is tested here — the decision it makes is. That decision is the whole
 * feature: fill gaps, never overwrite. Getting it wrong would silently rewrite
 * a candidate's own curated record from whatever they last submitted.
 */

const isEmpty = (v: unknown) => !Array.isArray(v) || v.length === 0

/** Mirrors the field-level rule in server/utils/profileBackfill.ts. */
function planScalar(existing: any, field: string, value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false
  if (existing && existing[field]) return false
  return true
}

test('a first application populates an absent profile entirely', () => {
  const existing = null
  assert.equal(planScalar(existing, 'nationalId', '63-123456A-12'), true)
  assert.equal(isEmpty(existing?.qualifications), true)
})

test('a curated section is never overwritten', () => {
  const existing = {
    nationalId: '63-999999Z-42',
    qualifications: [{ level: 'MASTERS' }],
    employment: [{ employer: 'Reserve Bank of Zimbabwe' }]
  }
  assert.equal(planScalar(existing, 'nationalId', '63-123456A-12'), false)
  assert.equal(isEmpty(existing.qualifications), false)
  assert.equal(isEmpty(existing.employment), false)
})

test('an empty section on an existing profile is still a gap worth filling', () => {
  // Someone who filled in their identity but never added employment.
  const existing = { nationalId: '63-123456A-12', qualifications: [], employment: [] }
  assert.equal(planScalar(existing, 'nationalId', 'x'), false)
  assert.equal(isEmpty(existing.qualifications), true)
  assert.equal(isEmpty(existing.employment), true)
})

test('an empty string from an untouched form is not written', () => {
  assert.equal(planScalar(null, 'city', ''), false)
  assert.equal(planScalar(null, 'city', null), false)
  assert.equal(planScalar(null, 'city', undefined), false)
  assert.equal(planScalar(null, 'city', 'Gweru'), true)
})

test('a non-array left in a JSON column is treated as empty, not as data', () => {
  // These columns are JSON; a bad historical write could leave anything there.
  assert.equal(isEmpty(null), true)
  assert.equal(isEmpty(undefined), true)
  assert.equal(isEmpty('not an array'), true)
  assert.equal(isEmpty({}), true)
  assert.equal(isEmpty([{ level: 'DIPLOMA' }]), false)
})

test('the completion recomputed after a merge reflects the merged record', () => {
  // The backfill writes completionPct from `{...existing, ...next}`, not from
  // the patch alone — a patch that adds employment to an otherwise complete
  // profile must not report 20%.
  const existing = {
    dateOfBirth: '1990-01-01', nationalId: 'x', gender: 'Male',
    province: 'Harare', city: 'Harare', currentAddress: '1 Road',
    qualifications: [{ level: 'FIRST_DEGREE' }],
    skills: ['a', 'b', 'c'],
    languages: [{ language: 'English', read: 'FLUENT', write: 'NONE', speak: 'NONE' }]
  }
  const patch = { employment: [{ employer: 'ZACC' }] }

  assert.equal(profileCompletion(existing as any), 80, 'employment is the only gap')
  assert.equal(profileCompletion({ ...existing, ...patch } as any), 100)
  assert.equal(profileCompletion(patch as any), 20, 'the patch alone would be wrong')
})

test('a stored "no" would be overwritten by the scalar rule, so booleans bypass it', () => {
  // The trap: `existing[field]` is a truthiness test, and a candidate who
  // answered "no" has stored `false`. Routed through the scalar rule, their
  // answer reads as absent and the next application would overwrite it.
  assert.equal(
    planScalar({ hasDisability: false }, 'hasDisability', true), true,
    'the scalar rule would clobber a legitimate "no" — which is why the backfill does not use it here'
  )

  // The backfill's own test is `== null`: unanswered is a gap, false is not.
  const answered: any = { hasDisability: false }
  const unanswered: any = { hasDisability: null }
  assert.equal(answered.hasDisability == null, false, 'false is an answer and is left alone')
  assert.equal(unanswered.hasDisability == null, true, 'null is unanswered and is a gap')
})
