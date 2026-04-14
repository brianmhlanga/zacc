import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supplierId = getRouterParam(event, 'id')
  const categoryId = getRouterParam(event, 'categoryId')
  if (!supplierId || !categoryId) {
    throw createError({ statusCode: 400, statusMessage: 'Supplier ID and category ID are required' })
  }

  await prisma.supplierCategoryApproval.deleteMany({
    where: {
      supplierId,
      categoryId
    }
  })

  return { success: true }
})
