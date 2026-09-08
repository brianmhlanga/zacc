import { prisma } from '../../../utils/prisma'
import { profileCompletion } from '../../../../shared/recruitment/profileCompletion'

/**
 * The candidate register — everyone who holds an account, not everyone who has
 * applied.
 *
 * The applications console answers "who is in the running for this post". It
 * cannot answer "does this person already have an account", "who registered and
 * never applied", or "why has this person not been able to sign in", because an
 * applicant only appears there once they have applied to something. Those are
 * the questions HR actually gets asked, and until now nothing could answer them.
 *
 * Server-paginated for the same reason the applications console is: this table
 * grows with every recruitment round and never shrinks.
 */
const SORTABLE = new Set(['createdAt', 'lastLoginAt', 'lastName', 'email'])

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const q = getQuery(event)
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(100, Math.max(5, Number(q.pageSize) || 25))
    const sortField = SORTABLE.has(String(q.sortField)) ? String(q.sortField) : 'createdAt'
    const sortOrder = String(q.sortOrder) === 'asc' ? 'asc' : 'desc'

    const where: any = {}

    const search = String(q.search || '').trim()
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    if (q.verified === 'true') where.emailVerifiedAt = { not: null }
    if (q.verified === 'false') where.emailVerifiedAt = null
    if (q.active === 'true') where.isActive = true
    if (q.active === 'false') where.isActive = false
    // A locked account is the usual reason behind "I cannot sign in".
    if (q.locked === 'true') where.lockedUntil = { gt: new Date() }
    if (q.hasApplied === 'true') where.applications = { some: {} }
    if (q.hasApplied === 'false') where.applications = { none: {} }

    const [total, rows] = await Promise.all([
      prisma.candidate.count({ where }),
      prisma.candidate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ [sortField]: sortOrder }],
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true,
          isActive: true, emailVerifiedAt: true, lastLoginAt: true,
          failedLoginCount: true, lockedUntil: true, createdAt: true,
          profile: true,
          _count: { select: { applications: true, documents: true, drafts: true } }
        }
      })
    ])

    const now = new Date()

    const [verified, unverified, withApplications, lockedOut] = await Promise.all([
      prisma.candidate.count({ where: { ...where, emailVerifiedAt: { not: null } } }),
      prisma.candidate.count({ where: { ...where, emailVerifiedAt: null } }),
      prisma.candidate.count({ where: { ...where, applications: { some: {} } } }),
      prisma.candidate.count({ where: { ...where, lockedUntil: { gt: now } } })
    ])

    return {
      rows: rows.map((c: any) => ({
        id: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        isActive: c.isActive,
        emailVerified: Boolean(c.emailVerifiedAt),
        emailVerifiedAt: c.emailVerifiedAt,
        lastLoginAt: c.lastLoginAt,
        // Surfaced rather than left in the column, because "locked" is a state
        // with an expiry and a raw timestamp reads as neither.
        isLocked: Boolean(c.lockedUntil && c.lockedUntil > now),
        lockedUntil: c.lockedUntil,
        failedLoginCount: c.failedLoginCount,
        createdAt: c.createdAt,
        province: c.profile?.province ?? null,
        profileCompletion: profileCompletion(c.profile),
        applicationCount: c._count.applications,
        documentCount: c._count.documents,
        draftCount: c._count.drafts
      })),
      page,
      pageSize,
      total,
      summary: { total, verified, unverified, withApplications, lockedOut }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/candidates] list failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load candidates' })
  }
})
