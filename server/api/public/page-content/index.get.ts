import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const pageKey = query.pageKey as string | undefined
    const sectionKey = query.sectionKey as string | undefined

    const where: any = {
      isVisible: true
    }
    
    if (pageKey) {
      where.pageKey = pageKey
    }
    
    if (sectionKey) {
      where.sectionKey = sectionKey
    }

    const content = await prisma.pageContent.findMany({
      where,
      orderBy: [
        { pageKey: 'asc' },
        { order: 'asc' }
      ]
    })
    
    return content
  } catch (error: any) {
    console.error('[Page Content API] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch page content'
    })
  }
})

