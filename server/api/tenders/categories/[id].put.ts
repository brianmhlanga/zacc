import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

const schema = z.object({ name: z.string().min(2).optional(), description: z.string().optional().nullable(), isActive: z.boolean().optional() })

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })
  const data = schema.parse(await readBody(event))
  return await prisma.tenderCategory.update({ where: { id }, data })
})
