import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicVacancyWhere } from '../server/utils/vacancyVisibility'

const NOW = new Date('2026-09-09T10:00:00Z')

test('a vacancy must be published and active for anyone, staff included', () => {
  for (const staffViewer of [true, false]) {
    const w = publicVacancyWhere({ staffViewer, requireOpen: false, now: NOW })
    assert.equal(w.isPublished, true)
    assert.equal(w.isActive, true)
  }
})

test('an anonymous viewer never matches a test vacancy', () => {
  const w = publicVacancyWhere({ staffViewer: false, requireOpen: true, now: NOW })
  assert.equal(w.isTestMode, false)
})

test('a staff viewer gets no isTestMode key at all, rather than isTestMode: true', () => {
  // The inversion is the dangerous one: `isTestMode: true` reads correct and
  // would hide every REAL vacancy from the people doing the testing.
  const w = publicVacancyWhere({ staffViewer: true, requireOpen: true, now: NOW })
  assert.equal('isTestMode' in w, false)
})

test('requireOpen adds the closing-date bound, and uses the injected clock', () => {
  const open = publicVacancyWhere({ staffViewer: false, requireOpen: true, now: NOW })
  assert.deepEqual(open.closingDate, { gte: NOW })
})

test('requireOpen false omits closingDate entirely', () => {
  // The wizard routes need to FIND a closed vacancy so they can render the
  // closed state or answer 410; filtering it out would turn those into 404s.
  const w = publicVacancyWhere({ staffViewer: false, requireOpen: false, now: NOW })
  assert.equal('closingDate' in w, false)
})

test('idOrSlug builds the disjunction itself', () => {
  const w = publicVacancyWhere({
    staffViewer: false, requireOpen: false, identity: { kind: 'idOrSlug', value: 'x' }, now: NOW
  })
  assert.deepEqual(w.OR, [{ id: 'x' }, { slug: 'x' }])
})

test('id identity is a plain equality, not a disjunction', () => {
  const w = publicVacancyWhere({
    staffViewer: false, requireOpen: true, identity: { kind: 'id', value: 'job_1' }, now: NOW
  })
  assert.equal(w.id, 'job_1')
  assert.equal('OR' in w, false)
})

test('the helper never emits a logical operator a caller could clobber', () => {
  // The whole reason this function owns the entire `where`: a caller writing
  // `{ ...fragment, OR: [...] }` would silently drop one side of the OR, and
  // findFirst would then match an arbitrary published job. If a future change
  // expresses visibility as a disjunction, this test fails and forces the
  // author to look at every call site.
  for (const staffViewer of [true, false]) {
    for (const requireOpen of [true, false]) {
      const w = publicVacancyWhere({ staffViewer, requireOpen, now: NOW })
      assert.equal('AND' in w, false)
      assert.equal('NOT' in w, false)
      assert.equal('OR' in w, false, 'OR may only come from the identity branch')
    }
  }
})

test('the visibility rule is identical whether or not an identity is given', () => {
  // Guards against a refactor that accidentally relaxes the predicate on the
  // single-vacancy lookups, which are the ones reachable by guessing a slug.
  const list = publicVacancyWhere({ staffViewer: false, requireOpen: false, now: NOW })
  const one = publicVacancyWhere({
    staffViewer: false, requireOpen: false, identity: { kind: 'idOrSlug', value: 'x' }, now: NOW
  })
  assert.equal(one.isPublished, list.isPublished)
  assert.equal(one.isActive, list.isActive)
  assert.equal(one.isTestMode, list.isTestMode)
})
