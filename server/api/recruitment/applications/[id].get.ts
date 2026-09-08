import { prisma } from '../../../utils/prisma'
import { signFileUrl } from '../../../utils/signedFileUrl'

/**
 * The full application dossier for HR.
 *
 * Document URLs come back signed. The uploads route now fences anything under
 * `recruitment/`, and an admin page renders attachments as plain links that
 * cannot carry an Authorization header — a short-lived signature is what lets
 * those links work without opening the files to anyone with the path.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Application id is required' })

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: { select: { id: true, title: true, department: true, grade: true, closingDate: true, panelSpreadThreshold: true } },
        stage: true,
        candidate: { select: { id: true, email: true, emailVerifiedAt: true } },
        qualifications: true,
        employments: { orderBy: { sortOrder: 'asc' } },
        declarations: true,
        skills: true,
        documents: { orderBy: { uploadedAt: 'asc' } },
        criterionScores: { orderBy: { bucket: 'asc' } },
        keywordHits: { orderBy: [{ isRequired: 'desc' }, { keyword: 'asc' }] },
        flags: { orderBy: { severity: 'desc' } },
        stageEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
        messages: { orderBy: { createdAt: 'desc' }, take: 50 },
        panelScores: {
          where: { isSubmitted: true },
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
            criterion: { select: { key: true, label: true, maxPoints: true } }
          }
        },
        reviews: {
          where: { isSubmitted: true },
          include: { reviewer: { select: { id: true, name: true, email: true } } }
        },
        invitations: { include: { event: true } }
      }
    })

    if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })

    const stages = await prisma.recruitmentStage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, key: true, internalLabel: true, publicLabel: true, colorHex: true, isRejection: true }
    })

    // Anything still queued for this candidate, so HR can see a rejection is
    // pending before they act rather than after the email has gone.
    const pendingNotifications = await prisma.emailOutbox.findMany({
      // Same three states the candidate endpoints hold on. A CLAIMED row is one
      // a worker has picked up but not yet sent; if the dossier omitted it, it
      // would report "nothing queued" while the candidate is still being held.
      where: { contextType: 'application', contextId: id, status: { in: ['SCHEDULED', 'CLAIMED', 'SKIPPED'] } },
      select: { id: true, subject: true, scheduledFor: true, status: true, templateKey: true }
    })

    return {
      ...application,
      documents: application.documents.map((d: any) => ({
        ...d,
        // 30 minutes: long enough to read a dossier, short enough that a copied
        // link is not a lasting disclosure.
        signedUrl: d.fileUrl ? signFileUrl(d.fileUrl, 1800) : null
      })),
      cvSignedUrl: application.cvUrl ? signFileUrl(application.cvUrl, 1800) : null,
      stages,
      pendingNotifications
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/applications] dossier failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load the application' })
  }
})
