/**
 * Guards the candidate portal.
 *
 * Entirely separate from `middleware/admin.ts`: a different session, a
 * different cookie, a different sign-in page. An admin session confers nothing
 * here, and a candidate session confers nothing in the admin area — the two
 * never consult each other.
 *
 * This is a convenience guard, not the security boundary. Every candidate
 * endpoint calls `requireCandidate` server-side; without that, hiding a page in
 * the browser would protect nothing. What this adds is that a signed-out
 * visitor lands on the sign-in page with their destination remembered, instead
 * of on a page that renders empty and then 401s in the background.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { candidate, fetchSession } = useCandidateAuth()

  await fetchSession()
  if (candidate.value) return

  return navigateTo({
    path: '/candidate/login',
    query: { returnTo: to.fullPath }
  })
})
