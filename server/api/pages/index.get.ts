import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // Get unique pageKeys from PageContent using groupBy
    const pageContents = await prisma.pageContent.groupBy({
      by: ['pageKey'],
      orderBy: {
        pageKey: 'asc'
      }
    })

    // Format as pages with label and value
    const pages = pageContents.map((content) => ({
      label: content.pageKey.charAt(0).toUpperCase() + content.pageKey.slice(1),
      value: content.pageKey,
      pageKey: content.pageKey
    }))

    // If no pages exist, return common/default pages
    if (pages.length === 0) {
      const commonPages = [
        { label: 'Home', value: 'home', pageKey: 'home' },
        { label: 'About', value: 'about', pageKey: 'about' },
        { label: 'Contact', value: 'contact', pageKey: 'contact' },
        { label: 'Legislation', value: 'legislation', pageKey: 'legislation' },
        { label: 'Services', value: 'services', pageKey: 'services' },
        { label: 'Reports', value: 'reports', pageKey: 'reports' },
        { label: 'News', value: 'news', pageKey: 'news' },
        { label: 'Rulings', value: 'rulings', pageKey: 'rulings' },
        { label: 'Jobs', value: 'jobs', pageKey: 'jobs' },
        { label: 'Downloads', value: 'downloads', pageKey: 'downloads' }
      ]
      return commonPages
    }

    return pages
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch pages'
    })
  }
})

