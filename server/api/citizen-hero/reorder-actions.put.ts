import { z } from 'zod'
import { prisma } from '../../utils/prisma'
import { getOrCreateCitizenHeroPanel } from '../../utils/citizenHeroPanel'

const bodySchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { orderedIds } = bodySchema.parse(await readBody(event))
  const panel = await getOrCreateCitizenHeroPanel()

  const actions = await prisma.citizenHeroAction.findMany({
    where: { panelId: panel.id },
    select: { id: true }
  })
  const validIds = new Set(actions.map((a) => a.id))
  for (const oid of orderedIds) {
    if (!validIds.has(oid)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid action id in order list' })
    }
  }
  if (orderedIds.length !== validIds.size) {
    throw createError({ statusCode: 400, statusMessage: 'Order list must include every action' })
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.citizenHeroAction.update({
        where: { id },
        data: { sortOrder: index }
      })
    )
  )

  return { ok: true }
})
