import { z } from 'zod'
import { prisma } from '../../../../utils/prisma'
import { getSupplierFromRequest } from '../../../../utils/supplierAuth'

const bidSchema = z.object({
  notes: z.string().optional().nullable(),
  totalAmount: z.number().optional().nullable(),
  documents: z.array(z.object({ fileName: z.string(), fileUrl: z.string().startsWith('/api/uploads/'), fileType: z.string(), fileSize: z.number().int().positive() })).default([]),
  lineItems: z.array(z.object({ tenderItemId: z.string(), unitPrice: z.number(), quantity: z.number().optional().nullable(), totalPrice: z.number().optional().nullable() })).default([])
})

export default defineEventHandler(async (event) => {
  const supplier = await getSupplierFromRequest(event)
  if (!supplier) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const tenderId = getRouterParam(event, 'id')
  if (!tenderId) throw createError({ statusCode: 400, statusMessage: 'Tender ID is required' })

  const tender = await prisma.tender.findUnique({ where: { id: tenderId }, include: { lineItems: true } })
  if (!tender || !tender.isPublished) throw createError({ statusCode: 404, statusMessage: 'Tender not found' })
  if (new Date(tender.closingDate) <= new Date()) throw createError({ statusCode: 409, statusMessage: 'Tender has closed' })

  const approval = await prisma.supplierCategoryApproval.findUnique({ where: { supplierId_categoryId: { supplierId: supplier.id, categoryId: tender.categoryId } } })
  if (!approval || approval.status !== 'APPROVED') throw createError({ statusCode: 403, statusMessage: 'Supplier is not approved for this tender category' })

  const data = bidSchema.parse(await readBody(event))
  if (tender.type === 'RFQ' && data.lineItems.length === 0) throw createError({ statusCode: 400, statusMessage: 'RFQ bid requires line item prices' })

  const bid = await prisma.tenderBid.upsert({
    where: { tenderId_supplierId: { tenderId, supplierId: supplier.id } },
    update: {
      notes: data.notes ?? null,
      totalAmount: data.totalAmount ?? null,
      status: 'SUBMITTED'
    },
    create: {
      tenderId,
      supplierId: supplier.id,
      notes: data.notes ?? null,
      totalAmount: data.totalAmount ?? null,
      status: 'SUBMITTED'
    }
  })

  await prisma.tenderBidDocument.deleteMany({ where: { bidId: bid.id } })
  if (data.documents.length) {
    await prisma.tenderBidDocument.createMany({ data: data.documents.map((d) => ({ ...d, bidId: bid.id })) })
  }

  await prisma.tenderBidLineItem.deleteMany({ where: { bidId: bid.id } })
  if (data.lineItems.length) {
    await prisma.tenderBidLineItem.createMany({ data: data.lineItems.map((li) => ({ ...li, bidId: bid.id })) })
  }

  return { success: true, bidId: bid.id, updated: true }
})
