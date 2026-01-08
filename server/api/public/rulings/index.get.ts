import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const year = query.year as string | undefined
    const outcome = query.outcome as string | undefined

    // Build where clause - only published rulings
    const where: any = {
      isPublished: true
    }
    
    if (year) {
      where.year = year
    }
    
    if (outcome) {
      where.outcome = outcome
    }

    // Fetch rulings with tags
    const rulings = await prisma.ruling.findMany({
      where,
      include: {
        tags: true
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform tags to array of strings
    const transformedRulings = rulings.map(ruling => ({
      ...ruling,
      tags: ruling.tags.map(tag => tag.tag)
    }))

    return transformedRulings
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch rulings'
    })
  }
})

