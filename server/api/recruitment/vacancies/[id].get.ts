import { prisma } from '../../../utils/prisma'

/** A single vacancy with its full screening scheme, for the builder. */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Vacancy id is required' })

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        criteria: { orderBy: { sortOrder: 'asc' } },
        disqualifiers: { orderBy: { sortOrder: 'asc' } },
        documentSlots: { orderBy: { sortOrder: 'asc' } },
        panelMembers: {
          orderBy: { assignedAt: 'asc' },
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        },
        _count: { select: { applications: true } }
      }
    })

    if (!job) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

    return {
      ...job,
      // Editing criteria after applications exist would invalidate scores that
      // have already been computed, so the builder locks the scheme instead.
      canEditScheme: job._count.applications === 0,
      schemeLockReason:
        job._count.applications > 0
          ? `${job._count.applications} application(s) already scored against this scheme. Rescore from the applications console after changing it.`
          : null
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/vacancies] get failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load vacancy' })
  }
})
