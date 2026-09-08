/**
 * What a candidate is allowed to see of their own application's progress.
 *
 * The delayed-rejection feature exists so an outcome does not land the instant a
 * decision is recorded, and so HR can reverse that decision inside the hold
 * window without the candidate ever knowing. Writing the rejection stage
 * immediately and rendering its public label defeats both: a candidate
 * refreshing the portal reads the outcome while the email is still queued.
 *
 * So the application genuinely sits on the rejection stage internally — the
 * console shows the truth — while the candidate-facing projection reports the
 * last stage they could legitimately have seen, until the notice actually sends.
 */

export interface StageLike {
  key: string
  publicLabel: string
  publicDescription?: string | null
  colorHex?: string | null
  category?: string | null
  sortOrder?: number | null
  isRejection?: boolean | null
  isTerminal?: boolean | null
}

export interface CandidateFacingStage {
  key: string
  publicLabel: string
  publicDescription: string | null
  colorHex: string
  category: string
  sortOrder: number
}

/**
 * Used only when a rejection is held and the application has no earlier
 * non-terminal stage to fall back on — an application auto-rejected on submit,
 * for instance, which never reached screening.
 */
export const HELD_FALLBACK_STAGE: CandidateFacingStage = {
  key: 'under_review',
  publicLabel: 'Under review',
  publicDescription: 'Your application is being reviewed. We will be in touch once a decision is made.',
  colorHex: '#209341',
  category: 'SCREENING',
  sortOrder: 0
}

function toCandidateFacing(stage: StageLike): CandidateFacingStage {
  return {
    key: stage.key,
    publicLabel: stage.publicLabel,
    publicDescription: stage.publicDescription ?? null,
    colorHex: stage.colorHex ?? '#209341',
    category: stage.category ?? 'SCREENING',
    sortOrder: stage.sortOrder ?? 0
  }
}

export interface ResolvedCandidateStage {
  stage: CandidateFacingStage | null
  /** True when a rejection is being withheld — callers must also filter the timeline. */
  held: boolean
}

export function resolveCandidateStage(opts: {
  currentStage: StageLike | null | undefined
  /** Stages the application has previously occupied, oldest first. */
  priorStages?: Array<StageLike | null | undefined>
  /** True when an unsent rejection notice is queued for this application. */
  hasPendingRejection: boolean
}): ResolvedCandidateStage {
  const { currentStage, priorStages = [], hasPendingRejection } = opts

  if (!currentStage) return { stage: null, held: false }

  // Nothing to withhold: either no rejection is queued, or the application is
  // not on a rejection stage at all.
  if (!hasPendingRejection || !currentStage.isRejection) {
    return { stage: toCandidateFacing(currentStage), held: false }
  }

  // Report the most recent stage the candidate could legitimately have seen.
  // Using their real history rather than a hardcoded label means the wording is
  // whatever an administrator configured for that stage.
  const prior = [...priorStages]
    .reverse()
    .find((s): s is StageLike => Boolean(s) && !s!.isRejection && !s!.isTerminal)

  return { stage: toCandidateFacing(prior ?? HELD_FALLBACK_STAGE), held: true }
}

/**
 * Removes timeline entries that would disclose a withheld rejection.
 *
 * Masking the status pill alone is not enough — a stage event reading
 * "Not successful" leaks the outcome just as plainly.
 */
export function filterCandidateTimeline<T extends { toStageKey?: string | null }>(
  events: T[],
  opts: { held: boolean; rejectionStageKeys: Iterable<string> }
): T[] {
  if (!opts.held) return events
  const hidden = new Set(opts.rejectionStageKeys)
  return events.filter((e) => !e.toStageKey || !hidden.has(e.toStageKey))
}

// Re-exported so the existing server call sites keep their single import, while
// the admin dossier can read the same list from `shared/`.
export { REJECTION_TEMPLATE_KEYS, isRejectionTemplate } from '../../shared/recruitment/notifications'
