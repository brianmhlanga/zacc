import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { getSupplierFromRequest } from '../../../utils/supplierAuth'

const docSchema = z.object({ fileName: z.string().min(1), fileUrl: z.string().startsWith('/api/uploads/'), fileType: z.string().min(1), fileSize: z.number().int().positive() })

export default defineEventHandler(async (event) => {
  const supplier = await getSupplierFromRequest(event)
  if (!supplier) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const data = docSchema.parse(await readBody(event))
  const doc = await prisma.supplierDocument.create({
    data: { supplierId: supplier.id, ...data }
  })
  return doc
})
