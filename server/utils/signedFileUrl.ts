/**
 * Time-limited signed URLs for protected uploads (CVs, national-ID scans,
 * certificates, court documents).
 *
 * `server/api/uploads/[...path].get.ts` serves files with no authentication at
 * all, which is acceptable for a news image and unacceptable for a candidate's
 * ID document. Adding a session check alone is not enough: admin pages render
 * these as plain `<a href>` / `<img src>` and PDF dossiers embed them, none of
 * which can attach an Authorization header. A signature in the query string lets
 * those keep working while the file stays closed to everyone else.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_TTL_SECONDS = 900 // 15 minutes

function signingSecret(): string {
  const secret = process.env.NUXT_FILE_SIGNING_SECRET || process.env.NUXT_SESSION_PASSWORD
  if (!secret) {
    throw new Error(
      'Cannot sign file URLs: set NUXT_FILE_SIGNING_SECRET (or NUXT_SESSION_PASSWORD).'
    )
  }
  return secret
}

function computeSignature(path: string, exp: number): string {
  return createHmac('sha256', signingSecret()).update(`${path}|${exp}`).digest('hex')
}

/** Normalises to the relative path the signature is computed over. */
export function normalizeSignedPath(path: string): string {
  return path.replace(/^\/api\/uploads\//, '').replace(/^\/+/, '').split('?')[0] ?? ''
}

/**
 * Returns `/api/uploads/<path>?exp=…&sig=…`.
 * `path` may be given with or without the `/api/uploads/` prefix.
 */
export function signFileUrl(path: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): string {
  const relative = normalizeSignedPath(path)
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = computeSignature(relative, exp)
  return `/api/uploads/${relative}?exp=${exp}&sig=${sig}`
}

/** Constant-time comparison that tolerates mismatched lengths. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  // timingSafeEqual throws on differing lengths, so check first — the length of a
  // hex digest is not secret.
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function verifyFileSignature(
  path: string,
  exp?: string | null,
  sig?: string | null
): boolean {
  if (!exp || !sig) return false

  const expiry = Number(exp)
  if (!Number.isFinite(expiry)) return false
  if (expiry * 1000 < Date.now()) return false

  try {
    return safeEqual(sig, computeSignature(normalizeSignedPath(path), expiry))
  } catch {
    // Missing secret — fail closed rather than allowing unsigned access.
    return false
  }
}
