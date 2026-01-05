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

    const query = getQuery(event)
    const pageKey = query.pageKey as string | undefined

    // Build where clause
    const where: any = {}
    if (pageKey) {
      where.pageKey = pageKey
    }

    // Fetch page content
    const content = await prisma.pageContent.findMany({
      where,
      orderBy: [
        { pageKey: 'asc' },
        { order: 'asc' }
      ],
      select: {
        id: true,
        pageKey: true,
        sectionKey: true,
        title: true,
        content: true,
        imageUrl: true,
        order: true,
        isVisible: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return content
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch content'
    })
  }
})

