import type { H3Event } from 'h3'

/**
 * The single definition of which vacancies the public site may see.
 *
 * Six routes under `/api/public/` read `Job`, and each used to inline its own
 * predicate. They had already drifted — `jobs/[id].get.ts` has no closing-date
 * check at all — and adding a seventh condition to six hand-written objects is
 * how a test vacancy ends up in front of a real candidate.
 *
 * This function builds the WHOLE `where`, identity included, rather than
 * returning a fragment for callers to spread. Four of the six call sites do
 * their own id-or-slug lookup, and `{ ...fragment, OR: [...] }` silently drops
 * one `OR` the moment the fragment grows one — leaving `findFirst` to match an
 * arbitrary published job. That failure throws nothing and looks correct.
 * Composition is never the caller's job.
 *
 * Note on what this does NOT do: it deliberately preserves each route's
 * existing closing-date behaviour via `requireOpen` rather than unifying it.
 * Only two of the six pass `true`. The refactor buys one place to add a
 * condition and a consistent shape — it is not a fix for the behavioural drift.
 */

export type VacancyIdentity =
  | { kind: 'any' }
  | { kind: 'id'; value: string }
  | { kind: 'idOrSlug'; value: string }

export interface PublicVacancyWhereOptions {
  /**
   * Whether a signed-in staff member is looking. No default on purpose: a new
   * call site that forgets it should be a type error, not a silent
   * "visible to everyone".
   */
  staffViewer: boolean
  /**
   * True only where a closed vacancy must not match at all. The wizard routes
   * pass false deliberately — they need to FIND a closed vacancy in order to
   * render the closed state, or answer 410 rather than 404.
   */
  requireOpen: boolean
  identity?: VacancyIdentity
  /** Injected so tests do not depend on the clock. */
  now?: Date
}

export function publicVacancyWhere(opts: PublicVacancyWhereOptions): Record<string, any> {
  const { staffViewer, requireOpen, identity = { kind: 'any' }, now = new Date() } = opts

  const where: Record<string, any> = {
    isPublished: true,
    isActive: true
  }

  // Omitted entirely for staff. NOT `isTestMode: true` — that inversion reads
  // correct and would hide every real vacancy from the people testing.
  if (!staffViewer) where.isTestMode = false

  if (requireOpen) where.closingDate = { gte: now }

  if (identity.kind === 'id') {
    where.id = identity.value
  } else if (identity.kind === 'idOrSlug') {
    where.OR = [{ id: identity.value }, { slug: identity.value }]
  }

  return where
}

/**
 * Whether this request carries a CMS staff session.
 *
 * Any valid session counts — no `jobs` permission is required. Test mode
 * reveals an advert the whole world will see shortly, not personal data, and
 * gating it behind a grant would exclude the reviewers and panel members who
 * most need to rehearse. It does mean REPORTS_ADMIN, whose admin UI is
 * otherwise confined to reports, can see test vacancies.
 *
 * The session is a sealed cookie checked for `isActive` only at login, with a
 * seven-day lifetime and no per-request re-check, so this promises
 * "authenticated within the last week" rather than "currently employed".
 *
 * Wrapped because an unsealable or malformed cookie must degrade to anonymous,
 * never to a 500 on the public careers page.
 */
export async function isStaffViewer(event: H3Event): Promise<boolean> {
  try {
    const session = await getUserSession(event)
    return Boolean(session?.user?.id)
  } catch {
    return false
  }
}

/**
 * Marks a response as varying by session.
 *
 * Nothing in this repo caches — no `routeRules`, no `defineCachedEventHandler`,
 * no prerender, and both careers pages fetch client-side. But PM2 sits behind a
 * proxy that is not in this repo, and a single "cache /api/*" rule there would
 * let one staff request populate a shared cache that then serves the test
 * vacancy to every anonymous visitor.
 *
 * Set unconditionally, never only for staff: a header that appears only when a
 * cookie is present is itself a cookie-varying response, which makes the
 * problem worse rather than better.
 */
export function markVariesBySession(event: H3Event): void {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')
}
