import { prisma } from '../../../../utils/prisma'
import { getSupplierFromRequest } from '../../../../utils/supplierAuth'

export default defineEventHandler(async (event) => {
  const supplier = await getSupplierFromRequest(event)
  if (!supplier) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const docId = getRouterParam(event, 'docId')
  if (!docId) throw createError({ statusCode: 400, statusMessage: 'Document ID is required' })

  const doc = await prisma.supplierDocument.findUnique({
    where: { id: docId },
    select: { id: true, supplierId: true }
  })
  if (!doc || doc.supplierId !== supplier.id) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  await prisma.supplierDocument.delete({
    where: { id: docId }
  })

  return { success: true }
})
