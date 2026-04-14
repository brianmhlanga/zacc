import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const tenderId = getRouterParam(event, 'id')
  if (!tenderId) throw createError({ statusCode: 400, statusMessage: 'Tender ID is required' })

  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: {
      category: true,
      documents: true,
      lineItems: { orderBy: { itemNo: 'asc' } }
    }
  })
  if (!tender) throw createError({ statusCode: 404, statusMessage: 'Tender not found' })
  if (new Date(tender.closingDate) > new Date()) {
    throw createError({ statusCode: 403, statusMessage: 'Bids are hidden until tender closing date' })
  }

  const bids = await prisma.tenderBid.findMany({
    where: { tenderId },
    include: {
      tender: { select: { id: true, title: true, closingDate: true } },
      supplier: { select: { id: true, companyName: true, email: true, contactPerson: true } },
      documents: true,
      lineItems: {
        include: {
          tenderItem: {
            select: {
              id: true,
              itemNo: true,
              description: true,
              quantity: true,
              unit: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return {
    tender,
    bids
  }
})
