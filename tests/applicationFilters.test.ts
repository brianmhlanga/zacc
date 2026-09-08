import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildApplicationWhere,
  describeApplicationFilter,
  EXPORT_ROW_CAP
} from '../server/utils/applicationFilters'

test('an empty query still hides auto-rejected and withdrawn applications', () => {
  // The console's default view, and therefore the export's default too.
  assert.deepEqual(buildApplicationWhere({}), { isAutoRejected: false, isWithdrawn: false })
})

test('the noise filters lift only for the literal string "true"', () => {
  // Query values arrive as strings; "false" is truthy in JavaScript and this is
  // exactly where that bites.
  assert.equal(buildApplicationWhere({ includeAutoRejected: 'false' }).isAutoRejected, false)
  assert.equal('isAutoRejected' in buildApplicationWhere({ includeAutoRejected: 'true' }), false)
  assert.equal('isWithdrawn' in buildApplicationWhere({ includeWithdrawn: true }), false)
})

test('a score range builds one clause, and a half-open range builds half of it', () => {
  assert.deepEqual(buildApplicationWhere({ minScore: '60', maxScore: '80' }).finalScore, { gte: 60, lte: 80 })
  assert.deepEqual(buildApplicationWhere({ minScore: '60' }).finalScore, { gte: 60 })
  assert.deepEqual(buildApplicationWhere({ maxScore: '80' }).finalScore, { lte: 80 })
})

test('a non-numeric score bound is ignored rather than becoming NaN', () => {
  // A NaN in a Prisma comparison matches nothing and looks like an empty table.
  assert.equal('finalScore' in buildApplicationWhere({ minScore: '' }), false)
  assert.equal('finalScore' in buildApplicationWhere({ minScore: 'abc' }), false)
})

test('a zero minimum score is a real filter, not an absent one', () => {
  assert.deepEqual(buildApplicationWhere({ minScore: '0' }).finalScore, { gte: 0 })
})

test('search spans reference, both name fields and email', () => {
  const where = buildApplicationWhere({ search: '  chikore ' })
  assert.equal(where.OR.length, 5)
  // Trimmed: a trailing space from a paste would otherwise match nothing.
  assert.deepEqual(where.OR[0], { referenceNumber: { contains: 'chikore' } })
})

test('a whitespace-only search is not a filter', () => {
  assert.equal('OR' in buildApplicationWhere({ search: '   ' }), false)
})

test('the flagged toggle filters on a count, not on a boolean', () => {
  assert.deepEqual(buildApplicationWhere({ flaggedOnly: 'true' }).integrityFlagCount, { gt: 0 })
})

test('the audit description names each active filter and nothing else', () => {
  assert.equal(describeApplicationFilter({}), 'no filters')
  const s = describeApplicationFilter({ jobId: 'job_1', minScore: '70', flaggedOnly: 'true', search: 'moyo' })
  assert.match(s, /vacancy=job_1/)
  assert.match(s, /score>=70/)
  assert.match(s, /flagged only/)
  assert.match(s, /search="moyo"/)
  assert.doesNotMatch(s, /stage=/)
})

test('the export cap is a real number the endpoint can compare against', () => {
  assert.ok(Number.isInteger(EXPORT_ROW_CAP) && EXPORT_ROW_CAP > 0)
})
