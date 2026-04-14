import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { getSupplierFromRequest } from '../../../utils/supplierAuth'

const schema = z.object({
  categoryIds: z.array(z.string()).default([])
})

export default defineEventHandler(async (event) => {
  const supplier = await getSupplierFromRequest(event)
  if (!supplier) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { categoryIds } = schema.parse(await readBody(event))
  const uniqueIds = [...new Set(categoryIds)]
  const validCategories = uniqueIds.length
    ? await prisma.tenderCategory.findMany({
        where: { id: { in: uniqueIds }, isActive: true },
        select: { id: true }
      })
    : []
  const validIds = validCategories.map((c) => c.id)

  await prisma.supplierCategoryApproval.deleteMany({
    where: {
      supplierId: supplier.id,
      categoryId: { notIn: validIds }
    }
  })

  if (validIds.length) {
    await prisma.supplierCategoryApproval.createMany({
      data: validIds.map((categoryId) => ({
        supplierId: supplier.id,
        categoryId,
        status: 'PENDING' as const
      })),
      skipDuplicates: true
    })
  }

  return {
    success: true,
    selectedCount: validIds.length
  }
})
