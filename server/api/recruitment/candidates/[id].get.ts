import { prisma } from '../../../utils/prisma'
import { profileCompletion, profileSections } from '../../../../shared/recruitment/profileCompletion'

/**
 * One candidate: the account, the reusable profile, and everything they have
 * applied for.
 *
 * Deliberately shows the *person* across vacancies, which is the view the
 * applications console cannot give — someone who has applied for four posts
 * appears there as four unrelated rows.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Candidate id is required' })

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        isActive: true, emailVerifiedAt: true, lastLoginAt: true,
        failedLoginCount: true, lockedUntil: true, createdAt: true, updatedAt: true,
        profile: true,
        applications: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, referenceNumber: true, finalScore: true, isAutoRejected: true,
            isShortlisted: true, isWithdrawn: true, submittedAt: true, createdAt: true,
            job: { select: { id: true, title: true, department: true, closingDate: true } },
            stage: { select: { internalLabel: true, publicLabel: true, colorHex: true } }
          }
        },
        drafts: {
          select: {
            id: true, updatedAt: true,
            job: { select: { id: true, title: true, slug: true, closingDate: true } }
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, label: true, fileName: true, fileSize: true, fileType: true, createdAt: true }
        },
        // Active sessions only — a revoked or expired one tells you nothing
        // about whether this person can currently get in.
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { lastUsedAt: 'desc' },
          select: { id: true, lastUsedAt: true, ipAddress: true, userAgent: true, createdAt: true }
        }
      }
    })

    if (!candidate) throw createError({ statusCode: 404, statusMessage: 'Candidate not found' })

    // What has been queued or sent to this person, so "did they ever get the
    // email" is answerable without going to the outbox and searching by address.
    const notifications = await prisma.emailOutbox.findMany({
      where: { toEmail: candidate.email },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true, templateKey: true, subject: true, status: true,
        scheduledFor: true, sentAt: true, lastError: true, createdAt: true
      }
    })

    const now = new Date()

    return {
      ...candidate,
      emailVerified: Boolean(candidate.emailVerifiedAt),
      isLocked: Boolean(candidate.lockedUntil && candidate.lockedUntil > now),
      profileCompletion: profileCompletion(candidate.profile as any),
      profileSections: profileSections(candidate.profile as any),
      notifications
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/candidates] load failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load the candidate' })
  }
})
