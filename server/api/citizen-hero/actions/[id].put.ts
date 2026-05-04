import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { getOrCreateCitizenHeroPanel } from '../../../utils/citizenHeroPanel'

const styleEnum = z.enum(['BUTTON', 'LINK', 'QR', 'BUTTON_QR'])

const bodySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  iconName: z.string().max(80).default('users'),
  iconTone: z.enum(['neutral', 'red', 'emerald', 'gold']).default('neutral'),
  actionStyle: styleEnum,
  ctaLabel: z.string().max(200).optional().nullable(),
  ctaUrl: z.string().max(2000).optional().nullable(),
  qrImageUrl: z.string().max(2000).optional().nullable(),
  isPublished: z.boolean()
})

function validateActionFields(data: z.infer<typeof bodySchema>) {
  const needCta =
    data.actionStyle === 'BUTTON' || data.actionStyle === 'LINK' || data.actionStyle === 'BUTTON_QR'
  const needQr = data.actionStyle === 'QR' || data.actionStyle === 'BUTTON_QR'
  if (needCta) {
    const label = data.ctaLabel?.trim()
    const url = data.ctaUrl?.trim()
    if (!label) throw new Error('CTA label is required for this action style')
    if (!url) throw new Error('CTA URL is required for this action style')
  }
  if (needQr) {
    const qr = data.qrImageUrl?.trim()
    if (!qr) throw new Error('QR image is required for this action style (upload an image in CMS)')
  }
}

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

  const raw = await readBody(event)
  const data = bodySchema.parse(raw)
  try {
    validateActionFields(data)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message || 'Validation error' })
  }

  const updated = await prisma.citizenHeroAction.update({
    where: { id },
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      iconName: data.iconName.trim() || 'users',
      iconTone: data.iconTone,
      actionStyle: data.actionStyle,
      ctaLabel: data.ctaLabel?.trim() || null,
      ctaUrl: data.ctaUrl?.trim() || null,
      qrImageUrl: data.qrImageUrl?.trim() || null,
      isPublished: data.isPublished
    }
  })

  return updated
})
