import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

    const existing = await prisma.tender.findUnique({ where: { id }, include: { _count: { select: { bids: true } } } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Tender not found' })
    if (existing._count.bids > 0) throw createError({ statusCode: 409, statusMessage: 'Cannot delete tender with bids' })

    await prisma.tender.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete tender' })
  }
})
