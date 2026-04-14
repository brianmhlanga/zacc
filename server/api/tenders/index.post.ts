import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const lineItemSchema = z.object({ itemNo: z.number().int().min(1), description: z.string().min(1), quantity: z.number().optional().nullable(), unit: z.string().optional().nullable() })
const docSchema = z.object({ fileName: z.string().min(1), fileUrl: z.string().startsWith('/api/uploads/', 'Upload document first'), fileType: z.string().min(1), fileSize: z.number().int().positive() })

const createSchema = z.object({
  title: z.string().min(1),
  reference: z.string().optional().nullable(),
  details: z.string().min(1),
  closingDate: z.coerce.date(),
  type: z.enum(['NORMAL', 'RFQ']).default('NORMAL'),
  categoryId: z.string().min(1),
  isPublished: z.boolean().default(true),
  documents: z.array(docSchema).default([]),
  lineItems: z.array(lineItemSchema).default([])
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const data = createSchema.parse(await readBody(event))
    if (data.type === 'RFQ' && data.lineItems.length === 0) throw createError({ statusCode: 400, statusMessage: 'RFQ requires line items' })

    const tender = await prisma.tender.create({
      data: {
        title: data.title,
        reference: data.reference ?? null,
        details: data.details,
        closingDate: data.closingDate,
        type: data.type,
        categoryId: data.categoryId,
        isPublished: data.isPublished,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        documents: { create: data.documents },
        lineItems: { create: data.type === 'RFQ' ? data.lineItems : [] }
      },
      include: { category: true, documents: true, lineItems: true }
    })
    return tender
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error.issues) throw createError({ statusCode: 400, statusMessage: error.issues[0]?.message || 'Validation error' })
    throw createError({ statusCode: 500, statusMessage: 'Failed to create tender' })
  }
})
