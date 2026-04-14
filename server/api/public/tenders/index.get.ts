import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const categoryId = query.categoryId as string | undefined
    const where: Record<string, unknown> = { isPublished: true }
    if (categoryId) where.categoryId = categoryId

    const tenders = await prisma.tender.findMany({
      where,
      orderBy: [{ closingDate: 'desc' }],
      include: {
        category: true,
        documents: true,
        lineItems: { orderBy: { itemNo: 'asc' } }
      }
    })

    const now = Date.now()
    return tenders.map((t) => ({
      ...t,
      isOpen: new Date(t.closingDate).getTime() > now,
      countdownMs: Math.max(0, new Date(t.closingDate).getTime() - now)
    }))
  } catch (error: any) {
    console.error('[public tenders]', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load tenders' })
  }
})
