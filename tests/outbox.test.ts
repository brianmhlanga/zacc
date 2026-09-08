import { test } from 'node:test'
import assert from 'node:assert/strict'
import { backoffMs } from '../server/utils/outbox'

test('backoff doubles per attempt', () => {
  assert.equal(backoffMs(1), 60_000, '1 minute')
  assert.equal(backoffMs(2), 120_000)
  assert.equal(backoffMs(3), 240_000)
  assert.equal(backoffMs(4), 480_000)
  assert.equal(backoffMs(5), 960_000, '16 minutes')
})

test('backoff is capped at six hours', () => {
  const cap = 6 * 60 * 60_000
  assert.equal(backoffMs(20), cap)
  assert.equal(backoffMs(100), cap)
  assert.ok(backoffMs(9) <= cap)
})

test('backoff never returns a negative or zero delay', () => {
  // Guards against an attempt counter that somehow starts at 0.
  assert.equal(backoffMs(0), 60_000)
  assert.equal(backoffMs(-5), 60_000)
})
