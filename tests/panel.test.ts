import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  aggregatePanelScores,
  collapseToReviewerEntries,
  reviewerDeviations,
  mean,
  median,
  stdev,
  trimmedMean
} from '../shared/recruitment/panel'
import type { PanelScoreEntry, PanelCriterionScore } from '../shared/recruitment/panel'

const entry = (reviewerId: string, points: number, isChair = false): PanelScoreEntry => ({
  reviewerId,
  points,
  maxPoints: 100,
  isChair
})

test('statistics helpers behave on edge cases', () => {
  assert.equal(mean([]), 0)
  assert.equal(median([]), 0)
  assert.equal(median([5]), 5)
  assert.equal(median([1, 2, 3, 4]), 2.5, 'even count averages the middle pair')
  assert.equal(median([3, 1, 2]), 2, 'sorts before taking the middle')
  assert.equal(stdev([5]), 0, 'a single value has no spread')
  assert.equal(stdev([10, 10, 10]), 0)
})

test('returns null when no one has scored', () => {
  assert.equal(aggregatePanelScores([]), null)
})

test('a single reviewer cannot disagree with anyone', () => {
  const r = aggregatePanelScores([entry('a', 40)], 'MEAN', 20)!
  assert.equal(r.count, 1)
  assert.equal(r.value, 40)
  assert.equal(r.spread, 0)
  assert.equal(r.disagreement, false)
})

test('two reviewers far apart are flagged as disagreeing', () => {
  const r = aggregatePanelScores([entry('a', 20), entry('b', 80)], 'MEAN', 20)!
  assert.equal(r.mean, 50)
  assert.equal(r.spread, 60)
  assert.equal(r.disagreement, true)
})

test('two reviewers close together are not flagged', () => {
  const r = aggregatePanelScores([entry('a', 62), entry('b', 70)], 'MEAN', 20)!
  assert.equal(r.spread, 8)
  assert.equal(r.disagreement, false)
})

test('the threshold is exclusive, so exactly-at-threshold is consensus', () => {
  const r = aggregatePanelScores([entry('a', 50), entry('b', 70)], 'MEAN', 20)!
  assert.equal(r.spread, 20)
  assert.equal(r.disagreement, false)
})

test('MEDIAN resists a single outlier', () => {
  const scores = [entry('a', 70), entry('b', 72), entry('c', 5)]
  assert.equal(aggregatePanelScores(scores, 'MEAN', 100)!.value, 49)
  assert.equal(aggregatePanelScores(scores, 'MEDIAN', 100)!.value, 70)
})

test('TRIMMED_MEAN drops the extremes once there are four scores', () => {
  const scores = [entry('a', 10), entry('b', 60), entry('c', 64), entry('d', 90)]
  assert.equal(trimmedMean([10, 60, 64, 90]), 62)
  assert.equal(aggregatePanelScores(scores, 'TRIMMED_MEAN', 100)!.value, 62)
})

test('TRIMMED_MEAN falls back to MEAN below four scores, and says so', () => {
  // Trimming 2 of 3 is not a trimmed mean, it is one person's opinion.
  const r = aggregatePanelScores([entry('a', 30), entry('b', 60), entry('c', 90)], 'TRIMMED_MEAN', 100)!
  assert.equal(r.value, 60)
  assert.equal(r.fallbackFrom, 'TRIMMED_MEAN')
  assert.equal(r.aggregation, 'MEAN')
})

test('CHAIR_OVERRIDE takes the chair score', () => {
  const r = aggregatePanelScores([entry('a', 30), entry('b', 90, true)], 'CHAIR_OVERRIDE', 100)!
  assert.equal(r.value, 90)
  assert.equal(r.fallbackFrom, undefined)
})

test('CHAIR_OVERRIDE with no chair present falls back to MEAN', () => {
  const r = aggregatePanelScores([entry('a', 30), entry('b', 90)], 'CHAIR_OVERRIDE', 100)!
  assert.equal(r.value, 60)
  assert.equal(r.fallbackFrom, 'CHAIR_OVERRIDE')
})

test('spread is expressed in percentage points of maxPoints, not raw points', () => {
  const outOf20: PanelScoreEntry[] = [
    { reviewerId: 'a', points: 4, maxPoints: 20 },
    { reviewerId: 'b', points: 10, maxPoints: 20 }
  ]
  const r = aggregatePanelScores(outOf20, 'MEAN', 20)!
  assert.equal(r.spread, 30, '6 points of 20 is a 30-point spread')
  assert.equal(r.disagreement, true)
})

test('reviewer deviation surfaces a consistently lenient reviewer', () => {
  const d = reviewerDeviations([entry('lenient', 90), entry('b', 60), entry('c', 60)])
  const lenient = d.find((x) => x.reviewerId === 'lenient')!
  assert.equal(lenient.deviation, 20, '90 against a mean of 70')
  assert.equal(d.find((x) => x.reviewerId === 'b')!.deviation, -10)
})

test('reviewer deviation is zero when there is nothing to compare against', () => {
  assert.deepEqual(reviewerDeviations([entry('a', 55)]), [{ reviewerId: 'a', deviation: 0 }])
  assert.deepEqual(reviewerDeviations([]), [])
})

// ---------------------------------------------------------------------------
// Collapsing per-criterion rows to per-reviewer entries
// ---------------------------------------------------------------------------
// Aggregation compares reviewers. The stored rows are per (criterion, reviewer),
// and feeding those in directly compared questions with each other instead —
// which is how a panel that agreed exactly came to be flagged as disagreeing.

const row = (
  reviewerId: string,
  criterionId: string,
  points: number,
  maxPoints = 100,
  isChair = false
): PanelCriterionScore => ({ reviewerId, criterionId, points, maxPoints, isChair })

test('two reviewers who agreed on every criterion are not flagged as disagreeing', () => {
  // The exact case the demo fixture surfaced: both reviewers scored 75 on
  // technical competence and 100 on integrity. Uncollapsed, the reported spread
  // was 25 — the gap between two different questions.
  const rows = [
    row('a', 'technical', 75), row('a', 'integrity', 100),
    row('b', 'technical', 75), row('b', 'integrity', 100)
  ]

  const wrong = aggregatePanelScores(rows, 'MEAN', 20)!
  assert.equal(wrong.spread, 25, 'the old behaviour, kept here so the fix cannot silently regress')

  const right = aggregatePanelScores(collapseToReviewerEntries(rows), 'MEAN', 20)!
  assert.equal(right.count, 2, 'two reviewers, not four scores')
  assert.equal(right.spread, 0)
  assert.equal(right.disagreement, false)
})

test('a genuine disagreement still surfaces after collapsing', () => {
  const rows = [
    row('a', 'technical', 90), row('a', 'integrity', 90),
    row('b', 'technical', 30), row('b', 'integrity', 40)
  ]
  const r = aggregatePanelScores(collapseToReviewerEntries(rows), 'MEAN', 20)!
  assert.equal(r.count, 2)
  assert.equal(r.min, 35)
  assert.equal(r.max, 90)
  assert.equal(r.spread, 55)
  assert.equal(r.disagreement, true)
})

test('a reviewer is normalised across everything they scored', () => {
  // 30 of 50 and 90 of 150 are both 60%, so this reviewer sits at 60.
  const entries = collapseToReviewerEntries([
    row('a', 'c1', 30, 50),
    row('a', 'c2', 90, 150)
  ])
  assert.deepEqual(entries, [{ reviewerId: 'a', points: 60, maxPoints: 100, isChair: false }])
})

test('criteria with different ceilings do not distort the comparison', () => {
  // Reviewer b scores lower on both criteria, and must come out lower — which
  // raw point sums would not guarantee across different maxPoints.
  const entries = collapseToReviewerEntries([
    row('a', 'small', 10, 10), row('a', 'large', 180, 200),
    row('b', 'small', 5, 10), row('b', 'large', 100, 200)
  ])
  const byId = Object.fromEntries(entries.map((e) => [e.reviewerId, e.points]))
  assert.equal(byId.a, 90.5)
  assert.equal(byId.b, 50)
})

test('reviewers who scored different numbers of criteria stay comparable', () => {
  // One reviewer has not finished. Normalising over what each actually scored is
  // the only honest comparison; counting the unscored criterion as zero would
  // report a disagreement that is really an incomplete review.
  const entries = collapseToReviewerEntries([
    row('a', 'c1', 80), row('a', 'c2', 80),
    row('b', 'c1', 80)
  ])
  assert.equal(entries.length, 2)
  assert.equal(entries[0]!.points, 80)
  assert.equal(entries[1]!.points, 80)
  assert.equal(aggregatePanelScores(entries, 'MEAN', 20)!.spread, 0)
})

test('chair status survives the collapse', () => {
  // Without it CHAIR_OVERRIDE has no chair to find and falls back to the mean.
  const entries = collapseToReviewerEntries([
    row('chair', 'c1', 90, 100, true), row('chair', 'c2', 90, 100, true),
    row('member', 'c1', 30), row('member', 'c2', 30)
  ])
  const r = aggregatePanelScores(entries, 'CHAIR_OVERRIDE', 20)!
  assert.equal(r.value, 90)
  assert.equal(r.fallbackFrom, undefined, 'the chair was found, so no fallback')
})

test('collapsing an empty list yields no entries', () => {
  assert.deepEqual(collapseToReviewerEntries([]), [])
  assert.equal(aggregatePanelScores(collapseToReviewerEntries([])), null)
})

test('a criterion worth zero points does not produce a NaN reviewer', () => {
  const entries = collapseToReviewerEntries([row('a', 'c1', 0, 0)])
  assert.equal(entries[0]!.points, 0)
})
