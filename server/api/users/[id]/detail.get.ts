import { prisma } from '../../../utils/prisma'
import { getPermissionsForUser } from '../../../utils/permissions'
import { ADMIN_PERMISSION_MODULES } from '../../../utils/permissions'

/**
 * What a staff account actually is and does.
 *
 * The users list answers "who has an account". The edit dialog answers "what
 * may they do". Neither answers the question this Commission will actually be
 * asked: **what has this person done** — which vacancies they sit on, which
 * applications they scored, whose account they deactivated, what they exported.
 *
 * Hiring decisions at an anti-corruption commission get challenged, and the
 * audit log already records every consequential action. It was simply not
 * readable per-person anywhere.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'User id is required' })

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
        panelMemberships: {
          orderBy: { assignedAt: 'desc' },
          select: {
            id: true, role: true, assignedAt: true,
            canSeeIdentity: true, canSeeDemographics: true, canSeeOtherScores: true,
            job: {
              select: {
                id: true, title: true, department: true, closingDate: true,
                _count: { select: { applications: true } }
              }
            }
          }
        },
        _count: {
          select: {
            panelMemberships: true,
            panelScores: true,
            applicationReviews: true,
            createdNews: true,
            createdJobs: true,
            createdRulings: true,
            createdDownloads: true,
            createdTenders: true,
            createdGalleryImages: true
          }
        }
      }
    })

    if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

    // Their recommendations, which are the reviewer's actual verdicts rather
    // than a count of rows.
    const reviews = await prisma.applicationReview.findMany({
      where: { reviewerId: id, isSubmitted: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      select: {
        id: true, recommendation: true, comments: true, submittedAt: true,
        application: {
          select: {
            id: true, referenceNumber: true, finalScore: true,
            job: { select: { title: true } }
          }
        }
      }
    })

    // The audit trail. `actorId` is a plain column, not a relation, because an
    // audit row must survive the account it refers to being deleted.
    const [auditTrail, auditTotal, actionCounts] = await Promise.all([
      prisma.recruitmentAuditLog.findMany({
        where: { actorId: id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true, action: true, entityType: true, entityId: true,
          summary: true, ipAddress: true, createdAt: true
        }
      }),
      prisma.recruitmentAuditLog.count({ where: { actorId: id } }),
      prisma.recruitmentAuditLog.groupBy({
        by: ['action'],
        where: { actorId: id },
        _count: { _all: true }
      })
    ])

    const permissions = await getPermissionsForUser(id)

    return {
      ...user,
      reviews,
      auditTrail,
      auditTotal,
      actionCounts: actionCounts
        .map((a: any) => ({ action: a.action, count: a._count._all }))
        .sort((a: any, b: any) => b.count - a.count),
      // Presented against the full module list so "no grant" is visible as an
      // absence rather than simply missing from the response.
      permissions: ADMIN_PERMISSION_MODULES.map((m) => ({
        key: m.key,
        label: m.label,
        actions: (permissions as any)[m.key] ?? []
      })),
      // A super admin's grants are implicit; showing an empty list would read
      // as "can do nothing", which is the opposite of the truth.
      hasImplicitFullAccess: user.role === 'SUPER_ADMIN'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[users] detail failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load the user' })
  }
})
