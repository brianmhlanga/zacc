import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supplierId = getRouterParam(event, 'id')
  const docId = getRouterParam(event, 'docId')
  if (!supplierId || !docId) {
    throw createError({ statusCode: 400, statusMessage: 'Supplier ID and document ID are required' })
  }

  const doc = await prisma.supplierDocument.findUnique({
    where: { id: docId },
    select: { id: true, supplierId: true }
  })
  if (!doc || doc.supplierId !== supplierId) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  await prisma.supplierDocument.delete({
    where: { id: docId }
  })

  return { success: true }
})
