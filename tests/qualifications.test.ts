import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  QUALIFICATION_LEVELS,
  highestQualification,
  meetsQualification,
  qualificationPoints,
  qualificationLabel
} from '../shared/recruitment/qualifications'

test('ladder is ordered most advanced first and has unique ranks', () => {
  const ranks = QUALIFICATION_LEVELS.map((q) => q.rank)
  assert.equal(new Set(ranks).size, ranks.length, 'ranks must be unique')
  assert.deepEqual(ranks, [...ranks].sort((a, b) => b - a), 'must be descending')
})

test('points match the values agreed in the prototype', () => {
  assert.equal(qualificationPoints('DOCTORATE'), 100)
  assert.equal(qualificationPoints('MASTERS'), 90)
  assert.equal(qualificationPoints('FIRST_DEGREE'), 72)
  assert.equal(qualificationPoints('GRADE_7'), 8)
  assert.equal(qualificationLabel('HIGHER_DIPLOMA'), 'Higher Diploma / HND')
})

test('highest attained is by rank, not by list order', () => {
  assert.equal(highestQualification(['O_LEVEL', 'MASTERS', 'A_LEVEL']), 'MASTERS')
  assert.equal(highestQualification(['DIPLOMA']), 'DIPLOMA')
  // A candidate who ticks school levels plus a degree is a degree holder.
  assert.equal(highestQualification(['GRADE_7', 'O_LEVEL', 'A_LEVEL', 'FIRST_DEGREE']), 'FIRST_DEGREE')
})

test('highest attained handles empty and unknown input', () => {
  assert.equal(highestQualification([]), null)
  assert.equal(highestQualification(['NOT_A_LEVEL' as never]), null)
})

test('meetsQualification compares by rank, inclusive', () => {
  assert.equal(meetsQualification('MASTERS', 'FIRST_DEGREE'), true)
  assert.equal(meetsQualification('FIRST_DEGREE', 'FIRST_DEGREE'), true, 'must be inclusive')
  assert.equal(meetsQualification('DIPLOMA', 'FIRST_DEGREE'), false)
  assert.equal(meetsQualification(null, 'FIRST_DEGREE'), false)
  assert.equal(meetsQualification(undefined, 'O_LEVEL'), false)
})
