import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Fetch only active commissioners for public display
    const commissioners = await prisma.commissioner.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return commissioners
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch commissioners'
    })
  }
})

