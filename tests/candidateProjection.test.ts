import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveCandidateStage,
  filterCandidateTimeline,
  HELD_FALLBACK_STAGE
} from '../server/utils/candidateProjection'

const shortlisting = {
  key: 'shortlisting', publicLabel: 'Under review',
  publicDescription: 'The panel is ranking eligible applications.',
  colorHex: '#209341', category: 'SCREENING', sortOrder: 30,
  isRejection: false, isTerminal: false
}
const shortlisted = {
  key: 'shortlisted', publicLabel: 'Shortlisted',
  colorHex: '#16A34A', category: 'ASSESSMENT', sortOrder: 40,
  isRejection: false, isTerminal: false
}
const rejected = {
  key: 'rejected', publicLabel: 'Not successful',
  publicDescription: 'Your application was not taken forward.',
  colorHex: '#B42318', category: 'CLOSED', sortOrder: 100,
  isRejection: true, isTerminal: true
}
const offer = {
  key: 'offer', publicLabel: 'Offer', colorHex: '#16A34A',
  category: 'OFFER', sortOrder: 80, isRejection: false, isTerminal: true
}

test('a normal stage is reported as-is', () => {
  const r = resolveCandidateStage({
    currentStage: shortlisted, priorStages: [shortlisting], hasPendingRejection: false
  })
  assert.equal(r.held, false)
  assert.equal(r.stage!.publicLabel, 'Shortlisted')
})

test('a rejection with the notice still queued is withheld', () => {
  // The defect this whole module exists to fix: without this the candidate reads
  // "Not successful" while the email sits queued for 48 hours.
  const r = resolveCandidateStage({
    currentStage: rejected, priorStages: [shortlisting, shortlisted], hasPendingRejection: true
  })
  assert.equal(r.held, true)
  assert.notEqual(r.stage!.publicLabel, 'Not successful')
  // Falls back to the last stage they could legitimately have seen.
  assert.equal(r.stage!.key, 'shortlisted')
})

test('once the notice has sent, the rejection is shown', () => {
  const r = resolveCandidateStage({
    currentStage: rejected, priorStages: [shortlisting], hasPendingRejection: false
  })
  assert.equal(r.held, false)
  assert.equal(r.stage!.publicLabel, 'Not successful')
})

test('a withheld rejection skips earlier terminal stages', () => {
  // An offer is terminal; falling back to it would tell the candidate something
  // even less true than the rejection.
  const r = resolveCandidateStage({
    currentStage: rejected, priorStages: [shortlisting, offer], hasPendingRejection: true
  })
  assert.equal(r.stage!.key, 'shortlisting')
})

test('a withheld rejection never falls back to another rejection stage', () => {
  const autoRejected = { ...rejected, key: 'auto_rejected' }
  const r = resolveCandidateStage({
    currentStage: rejected, priorStages: [autoRejected], hasPendingRejection: true
  })
  assert.equal(r.stage!.key, HELD_FALLBACK_STAGE.key)
})

test('an application auto-rejected on submit falls back to the neutral default', () => {
  // No prior stage to borrow wording from.
  const r = resolveCandidateStage({
    currentStage: { ...rejected, key: 'auto_rejected' }, priorStages: [], hasPendingRejection: true
  })
  assert.equal(r.held, true)
  assert.equal(r.stage!.publicLabel, 'Under review')
})

test('a pending notice on a non-rejection stage changes nothing', () => {
  // A shortlisting notice is queued; there is nothing to conceal.
  const r = resolveCandidateStage({
    currentStage: shortlisted, priorStages: [shortlisting], hasPendingRejection: true
  })
  assert.equal(r.held, false)
  assert.equal(r.stage!.publicLabel, 'Shortlisted')
})

test('an unassigned stage resolves to null rather than throwing', () => {
  const r = resolveCandidateStage({ currentStage: null, hasPendingRejection: true })
  assert.equal(r.stage, null)
  assert.equal(r.held, false)
})

test('the timeline hides rejection events while held', () => {
  // Masking the status pill alone would leak the outcome here instead.
  const events = [
    { id: 1, toStageKey: 'received' },
    { id: 2, toStageKey: 'shortlisting' },
    { id: 3, toStageKey: 'rejected' }
  ]
  const filtered = filterCandidateTimeline(events, {
    held: true, rejectionStageKeys: ['rejected', 'auto_rejected']
  })
  assert.deepEqual(filtered.map((e) => e.id), [1, 2])
})

test('the timeline is untouched when nothing is held', () => {
  const events = [{ id: 1, toStageKey: 'received' }, { id: 3, toStageKey: 'rejected' }]
  const filtered = filterCandidateTimeline(events, {
    held: false, rejectionStageKeys: ['rejected']
  })
  assert.equal(filtered.length, 2)
})

test('timeline entries with no stage key survive filtering', () => {
  const events = [{ id: 1, toStageKey: null }]
  assert.equal(
    filterCandidateTimeline(events, { held: true, rejectionStageKeys: ['rejected'] }).length,
    1
  )
})
