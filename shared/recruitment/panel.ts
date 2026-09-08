/**
 * Panel score aggregation.
 *
 * Manual criteria are scored independently by several reviewers. Reporting an
 * average alone hides the case that matters most: two reviewers 4 points apart is
 * a consensus, two reviewers 40 points apart is an argument that a hiring panel
 * needs to have out loud before anyone is shortlisted. So spread travels with the
 * aggregate everywhere.
 *
 * Aggregation compares reviewers, never criteria. Stored scores are per
 * (criterion, reviewer), so callers must put them through
 * `collapseToReviewerEntries` first — see the note there for what goes wrong
 * otherwise.
 */
import type { PanelAggregation } from './types'

/** One reviewer's overall assessment. This is what aggregation compares. */
export interface PanelScoreEntry {
  reviewerId: string
  points: number
  maxPoints: number
  isChair?: boolean
}

/** One reviewer's score on one criterion — the shape stored in the database. */
export interface PanelCriterionScore {
  reviewerId: string
  criterionId: string
  points: number
  maxPoints: number
  isChair?: boolean
}

/**
 * Collapses per-criterion scores into one entry per reviewer.
 *
 * This has to happen before aggregation, and getting it wrong is subtle. Panel
 * scores are stored one row per (criterion, reviewer). Feeding those rows
 * straight to `aggregatePanelScores` compares *questions* with each other rather
 * than reviewers with each other: two reviewers who both scored 75 on technical
 * competence and both scored 100 on integrity would be reported as 25 points
 * apart and flagged as disagreeing, when in fact they agreed exactly.
 *
 * Each reviewer's assessment is normalised to 0–100 across everything they
 * scored. That keeps reviewers comparable when they scored different numbers of
 * criteria, or criteria with different ceilings, and it puts `spread` in
 * percentage points — the unit `panelSpreadThreshold` is already expressed in.
 */
export function collapseToReviewerEntries(rows: PanelCriterionScore[]): PanelScoreEntry[] {
  const byReviewer = new Map<string, { points: number; maxPoints: number; isChair: boolean }>()

  for (const row of rows) {
    const acc = byReviewer.get(row.reviewerId) ?? { points: 0, maxPoints: 0, isChair: false }
    acc.points += Number(row.points) || 0
    acc.maxPoints += Number(row.maxPoints) || 0
    acc.isChair = acc.isChair || Boolean(row.isChair)
    byReviewer.set(row.reviewerId, acc)
  }

  return [...byReviewer.entries()].map(([reviewerId, acc]) => ({
    reviewerId,
    points: acc.maxPoints > 0 ? Math.round((acc.points / acc.maxPoints) * 1000) / 10 : 0,
    maxPoints: 100,
    isChair: acc.isChair
  }))
}

export interface PanelAggregate {
  count: number
  /** The aggregate, on the same 0..maxPoints scale as the inputs. */
  value: number
  mean: number
  median: number
  /** Population standard deviation, in points. */
  stdev: number
  min: number
  max: number
  /** (max - min) expressed in percentage points of maxPoints. */
  spread: number
  /** True when spread exceeds the vacancy's configured threshold. */
  disagreement: boolean
  aggregation: PanelAggregation
  /** Set when the requested aggregation could not be applied. */
  fallbackFrom?: PanelAggregation
}

const round = (n: number) => Math.round(n * 100) / 100

export function mean(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

/** Population standard deviation — the panel *is* the population, not a sample of one. */
export function stdev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}

/** Drops one highest and one lowest. Needs at least 4 scores to mean anything. */
export function trimmedMean(values: number[]): number {
  if (values.length < 4) return mean(values)
  const sorted = [...values].sort((a, b) => a - b)
  return mean(sorted.slice(1, -1))
}

export function aggregatePanelScores(
  entries: PanelScoreEntry[],
  aggregation: PanelAggregation = 'MEAN',
  spreadThreshold = 20
): PanelAggregate | null {
  if (!entries.length) return null

  const values = entries.map((e) => e.points)
  const maxPoints = Math.max(...entries.map((e) => e.maxPoints), 0)

  const m = mean(values)
  const med = median(values)
  const sd = stdev(values)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = maxPoints > 0 ? ((max - min) / maxPoints) * 100 : 0

  let value: number
  let fallbackFrom: PanelAggregation | undefined

  switch (aggregation) {
    case 'MEDIAN':
      value = med
      break
    case 'TRIMMED_MEAN':
      if (values.length < 4) {
        // Trimming 2 of 3 scores is not a trimmed mean, it is a single opinion.
        value = m
        fallbackFrom = 'TRIMMED_MEAN'
      } else {
        value = trimmedMean(values)
      }
      break
    case 'CHAIR_OVERRIDE': {
      const chair = entries.find((e) => e.isChair)
      if (chair) {
        value = chair.points
      } else {
        value = m
        fallbackFrom = 'CHAIR_OVERRIDE'
      }
      break
    }
    case 'MEAN':
    default:
      value = m
      break
  }

  return {
    count: entries.length,
    value: round(value),
    mean: round(m),
    median: round(med),
    stdev: round(sd),
    min,
    max,
    spread: round(spread),
    // A single reviewer cannot disagree with anyone.
    disagreement: entries.length > 1 && spread > spreadThreshold,
    aggregation: fallbackFrom ? 'MEAN' : aggregation,
    ...(fallbackFrom ? { fallbackFrom } : {})
  }
}

/**
 * Per-reviewer deviation from the panel mean, as percentage points of maxPoints.
 *
 * Feeds the PANEL_ACTIVITY report: a reviewer consistently +15 against every panel
 * they sit on is scoring leniently, which is worth seeing before it decides a post.
 */
export function reviewerDeviations(
  entries: PanelScoreEntry[]
): Array<{ reviewerId: string; deviation: number }> {
  if (entries.length < 2) return entries.map((e) => ({ reviewerId: e.reviewerId, deviation: 0 }))
  const m = mean(entries.map((e) => e.points))
  return entries.map((e) => ({
    reviewerId: e.reviewerId,
    deviation: e.maxPoints > 0 ? round(((e.points - m) / e.maxPoints) * 100) : 0
  }))
}
