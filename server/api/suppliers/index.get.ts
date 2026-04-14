import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  return await prisma.supplier.findMany({
    include: {
      approvals: { include: { category: true } },
      documents: true,
      bids: { include: { tender: { select: { id: true, title: true, closingDate: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  })
})
