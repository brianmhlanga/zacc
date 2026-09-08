/**
 * Candidate portal authentication.
 *
 * Modelled on `server/utils/supplierAuth.ts` but deliberately not a copy. That
 * portal keeps its bearer token in localStorage, has no email verification, no
 * password reset and no session sweeper. Candidates are members of the public
 * submitting national ID numbers and disability disclosures, so the bar is
 * higher — a localStorage token is one XSS away from mass credential theft.
 *
 * The one thing the supplier portal got right is kept: only the SHA-256 hash of
 * a session token is ever stored.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, getHeader, getRequestIP } from 'h3'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'

export const CANDIDATE_COOKIE = 'zacc_candidate'

const SESSION_TTL_DAYS = 14
/** Refresh the expiry once a session is more than half elapsed. */
const SLIDING_REFRESH_RATIO = 0.5
/** Cost 12 rather than the 10 used elsewhere: ~250ms, fine at portal volumes. */
const BCRYPT_ROUNDS = 12
const MAX_FAILED_LOGINS = 8
const LOCKOUT_MINUTES = 15

const VERIFY_TTL_HOURS = 24
const RESET_TTL_HOURS = 1

/** A pre-computed hash used to equalise timing when an email does not exist. */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.WkQkxxfBcYVfWCwPO3q0m3H7Gk8XkTe'

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Candidate-prefixed on purpose. Everything in `server/utils/` is auto-imported
 * across the whole server, so a bare `hashPassword` collides with the one
 * nuxt-auth-utils exports for admin accounts. Two password hashes with the same
 * name, different algorithms and a build-time winner is a trap; the prefix
 * removes it, and matches every other export in this file.
 */
export function hashCandidatePassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createCandidateSession(
  event: H3Event,
  candidateId: string
): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600_000)

  await prisma.candidateSession.create({
    data: {
      candidateId,
      tokenHash: sha256(token),
      expiresAt,
      ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null,
      userAgent: getHeader(event, 'user-agent')?.slice(0, 500) ?? null
    }
  })

  setCookie(event, CANDIDATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Lax still allows the candidate to arrive from an emailed link and be
    // recognised, while blocking cross-site form posts.
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 3600
  })

  return token
}

export interface CandidateIdentity {
  id: string
  email: string
  firstName: string
  lastName: string
  emailVerifiedAt: Date | null
}

/** Resolves the signed-in candidate, or null. Cookie first, bearer as fallback. */
export async function getCandidateFromRequest(
  event: H3Event
): Promise<CandidateIdentity | null> {
  let token = getCookie(event, CANDIDATE_COOKIE)

  if (!token) {
    const auth = getHeader(event, 'authorization')
    if (auth?.startsWith('Bearer ')) token = auth.slice(7)
  }
  if (!token) return null

  const session = await prisma.candidateSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      candidate: {
        select: {
          id: true, email: true, firstName: true, lastName: true,
          isActive: true, emailVerifiedAt: true
        }
      }
    }
  })

  if (!session) return null
  if (session.revokedAt) return null
  if (session.expiresAt < new Date()) return null
  if (!session.candidate?.isActive) return null

  // Sliding expiry: an active candidate is not logged out mid-application.
  const ttlMs = SESSION_TTL_DAYS * 24 * 3600_000
  const remaining = session.expiresAt.getTime() - Date.now()
  if (remaining < ttlMs * SLIDING_REFRESH_RATIO) {
    await prisma.candidateSession.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + ttlMs), lastUsedAt: new Date() }
    })
    setCookie(event, CANDIDATE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_DAYS * 24 * 3600
    })
  }

  const { id, email, firstName, lastName, emailVerifiedAt } = session.candidate
  return { id, email, firstName, lastName, emailVerifiedAt }
}

/** Throws 401 unless a candidate is signed in. */
export async function requireCandidate(event: H3Event): Promise<CandidateIdentity> {
  const candidate = await getCandidateFromRequest(event)
  if (!candidate) {
    throw createError({ statusCode: 401, statusMessage: 'Please sign in to continue' })
  }
  return candidate
}

export async function revokeCandidateSession(event: H3Event): Promise<void> {
  const token = getCookie(event, CANDIDATE_COOKIE)
  if (token) {
    // Soft revoke rather than delete, so the sign-out is auditable.
    await prisma.candidateSession.updateMany({
      where: { tokenHash: sha256(token) },
      data: { revokedAt: new Date() }
    })
  }
  deleteCookie(event, CANDIDATE_COOKIE, { path: '/' })
}

/** Revokes every session — used after a password change. */
export async function revokeAllCandidateSessions(candidateId: string): Promise<void> {
  await prisma.candidateSession.updateMany({
    where: { candidateId, revokedAt: null },
    data: { revokedAt: new Date() }
  })
}

// ---------------------------------------------------------------------------
// Login with lockout
// ---------------------------------------------------------------------------

export interface LoginResult {
  ok: boolean
  candidateId?: string
  reason?: 'INVALID' | 'LOCKED' | 'INACTIVE'
  lockedUntil?: Date
}

/**
 * Verifies credentials.
 *
 * Always performs a bcrypt comparison, even when the email is unknown, so the
 * response time does not reveal which addresses have accounts.
 */
export async function verifyCandidateLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true, passwordHash: true, isActive: true,
      failedLoginCount: true, lockedUntil: true
    }
  })

  if (!candidate) {
    await bcrypt.compare(password, DUMMY_HASH)
    return { ok: false, reason: 'INVALID' }
  }

  if (candidate.lockedUntil && candidate.lockedUntil > new Date()) {
    return { ok: false, reason: 'LOCKED', lockedUntil: candidate.lockedUntil }
  }

  if (!candidate.isActive) {
    await bcrypt.compare(password, DUMMY_HASH)
    return { ok: false, reason: 'INACTIVE' }
  }

  const valid = await bcrypt.compare(password, candidate.passwordHash)

  if (!valid) {
    const failures = candidate.failedLoginCount + 1
    const shouldLock = failures >= MAX_FAILED_LOGINS
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        failedLoginCount: failures,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null
      }
    })
    return shouldLock
      ? { ok: false, reason: 'LOCKED', lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000) }
      : { ok: false, reason: 'INVALID' }
  }

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }
  })

  return { ok: true, candidateId: candidate.id }
}

// ---------------------------------------------------------------------------
// Single-use tokens (verification, password reset)
// ---------------------------------------------------------------------------

export type TokenPurpose = 'EMAIL_VERIFY' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'

export async function issueCandidateToken(
  candidateId: string,
  purpose: TokenPurpose,
  payload?: string
): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const hours = purpose === 'PASSWORD_RESET' ? RESET_TTL_HOURS : VERIFY_TTL_HOURS

  // Supersede any outstanding token of the same purpose, so an old reset link
  // in an inbox stops working the moment a new one is requested.
  await prisma.candidateToken.deleteMany({
    where: { candidateId, purpose, consumedAt: null }
  })

  await prisma.candidateToken.create({
    data: {
      candidateId,
      purpose,
      tokenHash: sha256(token),
      payload: payload ?? null,
      expiresAt: new Date(Date.now() + hours * 3600_000)
    }
  })

  return token
}

export interface ConsumedToken {
  candidateId: string
  payload: string | null
}

/**
 * Validates and consumes a token in one step.
 *
 * The consume is a conditional update, so a link clicked twice — by a mail
 * scanner and then by the candidate — cannot be used twice.
 */
export async function consumeCandidateToken(
  token: string,
  purpose: TokenPurpose
): Promise<ConsumedToken | null> {
  const row = await prisma.candidateToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, candidateId: true, purpose: true, payload: true, expiresAt: true, consumedAt: true }
  })

  if (!row) return null
  if (row.purpose !== purpose) return null
  if (row.consumedAt) return null
  if (row.expiresAt < new Date()) return null

  const claimed = await prisma.candidateToken.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() }
  })
  if (claimed.count === 0) return null

  return { candidateId: row.candidateId, payload: row.payload }
}

/** Constant-time string compare that tolerates differing lengths. */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
