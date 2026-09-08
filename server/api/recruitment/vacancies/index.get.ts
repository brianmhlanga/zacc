import { prisma } from '../../../utils/prisma'

/**
 * Vacancy list for the recruitment console.
 *
 * Decorates each row with the counts HR triages on, and a `schemeReady` flag so
 * the list can warn about a published STRUCTURED vacancy that has no scoring
 * scheme — which would accept applications and score every one of them zero.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const query = getQuery(event)
    const where: any = {}
    if (query.department) where.department = query.department
    if (query.mode) where.applicationMode = query.mode
    if (query.isPublished === 'true') where.isPublished = true
    if (query.isPublished === 'false') where.isPublished = false
    if (query.isActive === 'true') where.isActive = true
    if (query.isActive === 'false') where.isActive = false

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true, title: true, slug: true, department: true, location: true,
        grade: true, dutyStation: true, type: true, numberOfPosts: true,
        closingDate: true, openingDate: true, isPublished: true, isActive: true,
        applicationMode: true, applicationCount: true, scoringVersion: true,
        autoRejectEnabled: true, bucketWeights: true, createdAt: true, updatedAt: true,
        _count: {
          select: {
            applications: true,
            criteria: true,
            disqualifiers: true,
            documentSlots: true,
            panelMembers: true
          }
        }
      },
      orderBy: [{ isActive: 'desc' }, { closingDate: 'asc' }, { createdAt: 'desc' }]
    })

    const now = new Date()

    return jobs.map((job: any) => {
      const isStructured = job.applicationMode === 'STRUCTURED'
      const hasCriteria = job._count.criteria > 0
      const isOpen = job.isPublished && job.isActive && new Date(job.closingDate) >= now

      return {
        ...job,
        isOpen,
        daysToClose: Math.ceil((new Date(job.closingDate).getTime() - now.getTime()) / 86400000),
        // A structured vacancy with no criteria will score every applicant zero.
        schemeReady: !isStructured || hasCriteria,
        schemeWarning:
          isStructured && !hasCriteria
            ? 'No scoring criteria configured — applications would all score zero'
            : isStructured && job._count.documentSlots === 0
              ? 'No document slots configured — candidates cannot attach a CV'
              : null
      }
    })
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/vacancies] list failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load vacancies' })
  }
})
