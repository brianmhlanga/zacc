import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const query = getQuery(event)
    const isPublished = query.isPublished !== undefined ? query.isPublished === 'true' : undefined
    const categoryId = query.categoryId as string | undefined

    const where: Record<string, unknown> = {}
    if (isPublished !== undefined) where.isPublished = isPublished
    if (categoryId) where.categoryId = categoryId

    const tenders = await prisma.tender.findMany({
      where,
      orderBy: [{ closingDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        documents: true,
        lineItems: { orderBy: { itemNo: 'asc' } },
        _count: { select: { bids: true } }
      }
    })

    return tenders.map((t) => ({ ...t, canEdit: t._count.bids === 0, canDelete: t._count.bids === 0 }))
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tenders' })
  }
})
