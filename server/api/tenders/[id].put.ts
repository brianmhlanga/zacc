import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const lineItemSchema = z.object({ itemNo: z.number().int().min(1), description: z.string().min(1), quantity: z.number().optional().nullable(), unit: z.string().optional().nullable() })
const docSchema = z.object({ fileName: z.string().min(1), fileUrl: z.string().startsWith('/api/uploads/'), fileType: z.string().min(1), fileSize: z.number().int().positive() })

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  reference: z.string().optional().nullable(),
  details: z.string().min(1).optional(),
  closingDate: z.coerce.date().optional(),
  type: z.enum(['NORMAL', 'RFQ']).optional(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
  documents: z.array(docSchema).optional(),
  lineItems: z.array(lineItemSchema).optional()
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

    const existing = await prisma.tender.findUnique({ where: { id }, include: { _count: { select: { bids: true } } } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Tender not found' })
    if (existing._count.bids > 0) throw createError({ statusCode: 409, statusMessage: 'Cannot edit tender with bids' })

    const data = updateSchema.parse(await readBody(event))

    await prisma.tender.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.reference !== undefined ? { reference: data.reference } : {}),
        ...(data.details !== undefined ? { details: data.details } : {}),
        ...(data.closingDate !== undefined ? { closingDate: data.closingDate } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        updatedBy: session.user.id
      }
    })

    if (data.documents !== undefined) {
      await prisma.tenderDocument.deleteMany({ where: { tenderId: id } })
      if (data.documents.length) await prisma.tenderDocument.createMany({ data: data.documents.map((d) => ({ ...d, tenderId: id })) })
    }

    if (data.lineItems !== undefined) {
      await prisma.tenderLineItem.deleteMany({ where: { tenderId: id } })
      if (data.lineItems.length) await prisma.tenderLineItem.createMany({ data: data.lineItems.map((li) => ({ ...li, tenderId: id })) })
    }

    return await prisma.tender.findUnique({ where: { id }, include: { category: true, documents: true, lineItems: true } })
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error.issues) throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update tender' })
  }
})
