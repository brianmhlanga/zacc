import { prisma } from '../../../utils/prisma'

/** Pipeline stages plus the templates they can notify with, for the settings page. */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const [stages, templates] = await Promise.all([
      prisma.recruitmentStage.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { applications: true } } }
      }),
      prisma.notificationTemplate.findMany({
        where: { isActive: true },
        select: { id: true, key: true, name: true },
        orderBy: { name: 'asc' }
      })
    ])

    return { stages, templates }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/config] stages load failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load stages' })
  }
})
