import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    markVariesBySession(event)

    // requireOpen: false preserves this route's existing behaviour — it has
    // never filtered on closingDate. The helper owns the id-or-slug OR.
    const job = await prisma.job.findFirst({
      where: publicVacancyWhere({
        staffViewer: await isStaffViewer(event),
        requireOpen: false,
        identity: { kind: 'idOrSlug', value: String(id) }
      })
    })

    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    return job
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch job'
    })
  }
})

