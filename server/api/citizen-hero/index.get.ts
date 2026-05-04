import { prisma } from '../../utils/prisma'
import { getOrCreateCitizenHeroPanel } from '../../utils/citizenHeroPanel'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const panel = await getOrCreateCitizenHeroPanel()
  const actions = await prisma.citizenHeroAction.findMany({
    where: { panelId: panel.id },
    orderBy: { sortOrder: 'asc' }
  })

  return { panel, actions }
})
