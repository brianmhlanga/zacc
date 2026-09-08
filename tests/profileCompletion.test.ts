import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  profileCompletion,
  profileSections,
  profileGaps
} from '../shared/recruitment/profileCompletion'

const full = {
  dateOfBirth: '1990-04-11',
  nationalId: '63-123456A-12',
  gender: 'Female',
  province: 'Harare',
  city: 'Harare',
  currentAddress: '14 Samora Machel Avenue, Harare',
  qualifications: [{ level: 'FIRST_DEGREE', institution: 'University of Zimbabwe', yearObtained: 2014 }],
  employment: [{ employer: 'Auditor-General', jobTitle: 'Internal Auditor' }],
  skills: ['forensic audit', 'internal controls', 'IFRS'],
  languages: [{ language: 'English', read: 'FLUENT', write: 'FLUENT', speak: 'FLUENT' }]
}

test('a complete profile is 100', () => {
  assert.equal(profileCompletion(full), 100)
})

test('an empty or missing profile is 0, never NaN', () => {
  assert.equal(profileCompletion({}), 0)
  assert.equal(profileCompletion(null), 0)
  assert.equal(profileCompletion(undefined), 0)
})

test('the weights add up to exactly 100', () => {
  // Otherwise a "complete" profile reports 97% forever and nobody trusts the number.
  assert.equal(profileSections(full).reduce((s, x) => s + x.weight, 0), 100)
})

test('identity needs all three of its fields', () => {
  const partial = { ...full, gender: null }
  assert.equal(profileCompletion(partial), 75)
})

test('the long repeaters carry the most weight', () => {
  // They are what a candidate would otherwise retype for every post.
  const bySection = Object.fromEntries(profileSections(full).map((s) => [s.key, s.weight]))
  assert.ok(bySection.qualifications >= bySection.skills)
  assert.ok(bySection.employment >= bySection.languages)
})

test('two skills is not enough to match keywords against', () => {
  assert.equal(profileCompletion({ ...full, skills: ['excel', 'word'] }), 90)
  assert.equal(profileCompletion({ ...full, skills: ['excel', 'word', 'pastel'] }), 100)
})

test('a language row with no proficiency set does not count', () => {
  // The wizard seeds English, Shona and Ndebele at NONE, so an untouched profile
  // would otherwise score for a section the candidate never filled in.
  const untouched = [
    { language: 'English', read: 'NONE', write: 'NONE', speak: 'NONE' },
    { language: 'Shona', read: 'NONE', write: 'NONE', speak: 'NONE' }
  ]
  assert.equal(profileCompletion({ ...full, languages: untouched }), 90)
})

test('one proficiency in any of the three columns is enough', () => {
  const speaksOnly = [{ language: 'Ndebele', read: 'NONE', write: 'NONE', speak: 'NATIVE' }]
  assert.equal(profileCompletion({ ...full, languages: speaksOnly }), 100)
})

test('a non-array repeater is treated as empty rather than throwing', () => {
  // These columns are JSON and could hold anything a bad write left behind.
  assert.equal(profileCompletion({ ...full, qualifications: null }), 80)
  assert.equal(profileCompletion({ ...full, employment: 'not an array' as any }), 80)
})

test('gaps come back with the most valuable first', () => {
  const gaps = profileGaps({ skills: ['a', 'b', 'c'] })
  assert.equal(gaps[0]!.key, 'identity')
  assert.equal(gaps[0]!.weight, 25)
  assert.ok(gaps.every((g) => g.key !== 'skills'), 'a complete section is not a gap')
  assert.ok(gaps.every((g) => g.hint.length > 0), 'every gap says what to do about it')
})

test('a complete profile has no gaps', () => {
  assert.deepEqual(profileGaps(full), [])
})
