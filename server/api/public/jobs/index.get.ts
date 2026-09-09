import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const department = query.department as string | undefined

    markVariesBySession(event)

    // A vacancy in test mode is matched only for a signed-in staff member, so
    // the whole flow can be rehearsed on production before a real candidate
    // sees the post. See server/utils/vacancyVisibility.ts.
    const where: any = publicVacancyWhere({
      staffViewer: await isStaffViewer(event),
      requireOpen: true
    })

    // Mutated after the helper returns rather than merged in: the helper owns
    // the whole predicate, and a merge is where a caller's key silently wins.
    if (department) {
      where.department = department
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: [
        { closingDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return jobs
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch jobs'
    })
  }
})

