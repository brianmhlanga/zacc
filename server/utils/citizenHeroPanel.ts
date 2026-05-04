import { prisma } from './prisma'

const HOME_SLUG = 'home'

export async function getOrCreateCitizenHeroPanel() {
  const existing = await prisma.citizenHeroPanel.findUnique({
    where: { slug: HOME_SLUG }
  })
  if (existing) return existing
  return prisma.citizenHeroPanel.create({
    data: {
      slug: HOME_SLUG,
      title: 'Citizen Actions',
      subtitle: 'Explore ways to participate, report and engage.',
      footerText: 'Your voice. Your stance. Our collective integrity.',
      footerCtaLabel: 'Participate',
      footerCtaUrl: '/contact',
      isEnabled: true
    }
  })
}

export { HOME_SLUG }
