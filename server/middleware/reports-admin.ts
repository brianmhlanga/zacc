import { getRequestURL } from 'h3'

/**
 * REPORTS_ADMIN may only call a limited set of authenticated APIs.
 * Unauthenticated requests pass through; each route still enforces its own 401.
 */
export default defineEventHandler(async (event) => {
  let pathname = ''
  try {
    pathname = getRequestURL(event).pathname
  } catch {
    return
  }

  if (!pathname.startsWith('/api/')) return
  if (pathname.startsWith('/api/public/')) return
  if (pathname.startsWith('/api/auth/')) return

  const session = await getUserSession(event)
  if (!session?.user) return

  if (session.user.role === 'REPORTS_ADMIN') {
    const allowedPrefixes = ['/api/reports', '/api/dashboard/stats', '/api/uploads']
    const ok = allowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
    if (!ok) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: this account may only access reports administration'
      })
    }
  }
})
