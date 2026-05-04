import { z } from 'zod'
import { prisma } from '../../utils/prisma'
import { getOrCreateCitizenHeroPanel } from '../../utils/citizenHeroPanel'

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(2000).optional().nullable(),
  footerText: z.string().max(2000).optional().nullable(),
  footerCtaLabel: z.string().max(120).optional().nullable(),
  footerCtaUrl: z.string().max(2000).optional().nullable(),
  isEnabled: z.boolean()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = bodySchema.parse(await readBody(event))
  const panel = await getOrCreateCitizenHeroPanel()

  const updated = await prisma.citizenHeroPanel.update({
    where: { id: panel.id },
    data: {
      title: body.title,
      subtitle: body.subtitle?.trim() || null,
      footerText: body.footerText?.trim() || null,
      footerCtaLabel: body.footerCtaLabel?.trim() || null,
      footerCtaUrl: body.footerCtaUrl?.trim() || null,
      isEnabled: body.isEnabled
    }
  })

  return updated
})
