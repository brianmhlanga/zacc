import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

const schema = z.object({ categoryId: z.string(), status: z.enum(['PENDING', 'APPROVED', 'REJECTED']), notes: z.string().optional().nullable() })

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const supplierId = getRouterParam(event, 'id')
  if (!supplierId) throw createError({ statusCode: 400, statusMessage: 'Supplier ID required' })

  const data = schema.parse(await readBody(event))
  return await prisma.supplierCategoryApproval.upsert({
    where: { supplierId_categoryId: { supplierId, categoryId: data.categoryId } },
    update: { status: data.status, notes: data.notes ?? null },
    create: { supplierId, categoryId: data.categoryId, status: data.status, notes: data.notes ?? null }
  })
})
