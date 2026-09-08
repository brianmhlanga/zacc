import { test } from 'node:test'
import assert from 'node:assert/strict'
import { yearOptions } from '../app/utils/years'

const now = new Date('2026-09-08T00:00:00Z')

test('the most recent year comes first', () => {
  // A candidate who finished last year should not have to scroll for it.
  const years = yearOptions({ now })
  assert.equal(years[0], 2027)
  assert.equal(years[1], 2026)
})

test('one year ahead is offered, for a qualification still in progress', () => {
  // Refusing it pushes people into leaving the field blank instead.
  assert.ok(yearOptions({ now }).includes(2027))
  assert.ok(!yearOptions({ now }).includes(2028))
})

test('the list reaches far enough back for a late-career applicant', () => {
  const years = yearOptions({ now })
  assert.equal(years[years.length - 1], 1966)
  assert.equal(years.length, 62)
})

test('the range is configurable and stays descending', () => {
  const years = yearOptions({ now, back: 5, ahead: 0 })
  assert.deepEqual(years, [2026, 2025, 2024, 2023, 2022, 2021])
})

test('every entry is a plain number, not a string or a Date', () => {
  // The column is an Int and the API coerces; sending a Date would round-trip
  // as a timestamp and read as year 1970 after a save.
  assert.ok(yearOptions({ now }).every((y) => typeof y === 'number' && Number.isInteger(y)))
})

test('no duplicates and no gaps', () => {
  const years = yearOptions({ now, back: 10 })
  assert.equal(new Set(years).size, years.length)
  for (let i = 1; i < years.length; i++) {
    assert.equal(years[i - 1]! - years[i]!, 1)
  }
})
