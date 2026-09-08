/**
 * Notification keys the admin UI and the server both reason about.
 *
 * Kept in `shared/` rather than in `server/utils/candidateProjection.ts` because
 * the dossier needs the same list: it warns a reviewer that what they are looking
 * at is being withheld from the candidate, and it would be the one place able to
 * disagree with the endpoint that does the withholding.
 */

/** Template keys whose queued presence means a rejection is being withheld. */
export const REJECTION_TEMPLATE_KEYS = [
  'application.rejected',
  'application.auto_rejected'
] as const

export type RejectionTemplateKey = (typeof REJECTION_TEMPLATE_KEYS)[number]

export function isRejectionTemplate(key?: string | null): boolean {
  return Boolean(key) && (REJECTION_TEMPLATE_KEYS as readonly string[]).includes(key!)
}
