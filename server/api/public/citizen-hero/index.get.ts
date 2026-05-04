import { prisma } from '../../../utils/prisma'
import { HOME_SLUG } from '../../../utils/citizenHeroPanel'

export default defineEventHandler(async () => {
  try {
    const panel = await prisma.citizenHeroPanel.findUnique({
      where: { slug: HOME_SLUG },
      include: {
        actions: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!panel || !panel.isEnabled) {
      return {
        enabled: false,
        title: '',
        subtitle: '',
        footerText: '',
        footerCta: null as { label: string; url: string } | null,
        items: [] as unknown[]
      }
    }

    return {
      enabled: true,
      title: panel.title,
      subtitle: panel.subtitle || '',
      footerText: panel.footerText || '',
      footerCta:
        panel.footerCtaLabel && panel.footerCtaUrl
          ? { label: panel.footerCtaLabel, url: panel.footerCtaUrl }
          : null,
      items: panel.actions.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description || '',
        iconName: a.iconName,
        iconTone: a.iconTone,
        actionStyle: a.actionStyle,
        ctaLabel: a.ctaLabel,
        ctaUrl: a.ctaUrl,
        qrImageUrl: a.qrImageUrl
      }))
    }
  } catch (error: any) {
    console.error('[public/citizen-hero]', error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to load citizen actions'
    })
  }
})
