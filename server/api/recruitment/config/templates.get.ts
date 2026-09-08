import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    return await prisma.notificationTemplate.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { stages: true, outbox: true } }
      }
    })
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[recruitment/config] templates load failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load templates' })
  }
})
