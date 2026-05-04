import { prisma } from '../../../utils/prisma'
import { getOrCreateCitizenHeroPanel } from '../../../utils/citizenHeroPanel'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const panel = await getOrCreateCitizenHeroPanel()
  const existing = await prisma.citizenHeroAction.findFirst({
    where: { id, panelId: panel.id }
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Action not found' })
  }

  await prisma.citizenHeroAction.delete({ where: { id } })
  return { ok: true }
})
