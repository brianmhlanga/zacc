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

    const isReportsOnly = session.user.role === 'REPORTS_ADMIN'

    // Get current date and last month date for comparison
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch counts
    const [
      totalReports,
      lastMonthReports,
      totalNews,
      lastMonthNews,
      totalJobApplications,
      lastMonthJobApplications,
      totalContacts,
      lastMonthContacts,
      recentReports,
      recentContacts,
      recentNews
    ] = await Promise.all([
      // Total reports
      prisma.corruptionReport.count(),
      // Reports from last month
      prisma.corruptionReport.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      // Total news articles
      prisma.news.count(),
      // News from last month
      prisma.news.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      // Total job applications
      prisma.jobApplication.count(),
      // Job applications from last month
      prisma.jobApplication.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      // Total contact submissions
      prisma.contactSubmission.count(),
      // Contact submissions from last month
      prisma.contactSubmission.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      // Recent reports (last 5)
      prisma.corruptionReport.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          reportNumber: true,
          corruptionType: true,
          status: true,
          createdAt: true
        }
      }),
      // Recent contact submissions (last 5)
      prisma.contactSubmission.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          subject: true,
          status: true,
          isAnonymous: true,
          createdAt: true
        }
      }),
      // Recent news articles (last 5)
      prisma.news.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          isPublished: true,
          createdAt: true
        }
      })
    ])

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const reportsChange = calculateChange(totalReports, lastMonthReports)
    const newsChange = calculateChange(totalNews, lastMonthNews)
    const applicationsChange = calculateChange(totalJobApplications, lastMonthJobApplications)
    const contactsChange = calculateChange(totalContacts, lastMonthContacts)

    // Get counts for badges (new/unread items)
    const [newReportsCount, newNewsCount] = await Promise.all([
      // New reports (status = NEW)
      prisma.corruptionReport.count({
        where: {
          status: 'NEW'
        }
      }),
      // Unpublished news articles
      prisma.news.count({
        where: {
          isPublished: false
        }
      })
    ])

    const payload = {
      stats: {
        reports: {
          total: totalReports,
          change: reportsChange,
          isPositive: reportsChange >= 0
        },
        news: {
          total: totalNews,
          change: newsChange,
          isPositive: newsChange >= 0
        },
        jobApplications: {
          total: totalJobApplications,
          change: applicationsChange,
          isPositive: applicationsChange >= 0
        },
        contacts: {
          total: totalContacts,
          change: contactsChange,
          isPositive: contactsChange >= 0
        }
      },
      badges: {
        reports: newReportsCount,
        news: newNewsCount
      },
      recentReports: recentReports.map(report => ({
        id: report.id,
        reportNumber: report.reportNumber,
        type: report.corruptionType,
        status: report.status,
        date: report.createdAt
      })),
      recentContacts: recentContacts.map(contact => ({
        id: contact.id,
        name: contact.isAnonymous ? 'Anonymous' : contact.name,
        subject: contact.subject,
        status: contact.status,
        date: contact.createdAt
      })),
      recentNews: recentNews.map(news => ({
        id: news.id,
        title: news.title,
        isPublished: news.isPublished,
        date: news.createdAt
      }))
    }

    if (isReportsOnly) {
      return {
        stats: {
          reports: payload.stats.reports
        },
        badges: {
          reports: payload.badges.reports,
          news: 0
        },
        recentReports: payload.recentReports,
        recentContacts: [],
        recentNews: []
      }
    }

    return payload
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch dashboard statistics'
    })
  }
})

