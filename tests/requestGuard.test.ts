import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequestGuard } from '../app/utils/requestGuard'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

test('a single request applies', async () => {
  const guard = createRequestGuard()
  const r = await guard.run(async () => 'rows')
  assert.equal(r.status, 'applied')
  assert.equal(r.value, 'rows')
})

test('a slow first response never overwrites a fast second', async () => {
  // The exact bug: type "Chi", then "Chikafu"; the first query is broader and
  // slower, and lands last. Without the guard it paints over the right answer.
  const guard = createRequestGuard()

  const slow = guard.run(async () => { await delay(60); return 'stale' })
  await delay(5)
  const fast = guard.run(async () => { await delay(5); return 'fresh' })

  const [slowResult, fastResult] = await Promise.all([slow, fast])

  assert.equal(fastResult.status, 'applied')
  assert.equal(fastResult.value, 'fresh')
  assert.equal(slowResult.status, 'superseded')
  assert.equal(slowResult.value, undefined, 'a superseded run must not hand back a value')
})

test('the newest run wins across several in flight', async () => {
  const guard = createRequestGuard()
  const runs = [
    guard.run(async () => { await delay(40); return 'a' }),
    guard.run(async () => { await delay(30); return 'b' }),
    guard.run(async () => { await delay(1); return 'c' })
  ]
  const results = await Promise.all(runs)

  const applied = results.filter((r) => r.status === 'applied')
  assert.equal(applied.length, 1, 'exactly one run may apply')
  assert.equal(applied[0]!.value, 'c')
})

test('an aborted request reports as aborted, not failed', async () => {
  // Callers must not show an error toast for a request they superseded.
  const guard = createRequestGuard()

  const first = guard.run(async (signal) => {
    await delay(50)
    if (signal.aborted) {
      const err: any = new Error('The operation was aborted')
      err.name = 'AbortError'
      throw err
    }
    return 'never'
  })
  await delay(5)
  const second = guard.run(async () => 'second')

  const [a, b] = await Promise.all([first, second])
  assert.ok(a.status === 'aborted' || a.status === 'superseded')
  assert.equal(a.error, undefined)
  assert.equal(b.status, 'applied')
})

test('the signal is aborted when a newer run starts', async () => {
  const guard = createRequestGuard()
  let captured: AbortSignal | null = null

  const first = guard.run(async (signal) => { captured = signal; await delay(40); return 'a' })
  await delay(5)
  assert.equal(captured!.aborted, false, 'not aborted before the next run')

  const second = guard.run(async () => 'b')
  assert.equal(captured!.aborted, true, 'aborted once superseded')

  await Promise.all([first, second])
})

test('a genuine failure is reported', async () => {
  const guard = createRequestGuard()
  const r = await guard.run(async () => { throw new Error('500') })
  assert.equal(r.status, 'failed')
  assert.match(String((r.error as Error).message), /500/)
})

test('cancel stops an in-flight response from applying', async () => {
  // Teardown on unmount must not write into a destroyed component.
  const guard = createRequestGuard()
  const run = guard.run(async () => { await delay(30); return 'late' })
  guard.cancel()
  const r = await run
  assert.notEqual(r.status, 'applied')
})
