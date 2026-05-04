import { z } from 'zod'
import { prisma } from '../../../utils/prisma'

const trackSchema = z.object({
  reportNumber: z.string().min(1, 'Report number is required'),
  email: z.union([z.string().email(), z.literal('')]).optional()
})

function formatStatusLabel(status: string, customStatus?: string | null) {
  if (status === 'CUSTOM' && customStatus?.trim()) {
    return customStatus.trim()
  }
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = trackSchema.parse(body)
    const reportNumber = data.reportNumber.trim()
    const email = data.email?.trim() ? data.email.trim().toLowerCase() : undefined

    const report = await prisma.corruptionReport.findUnique({
      where: { reportNumber },
      include: {
        updates: {
          orderBy: { createdAt: 'asc' },
          select: {
            status: true,
            customStatus: true,
            createdAt: true
          }
        }
      }
    })

    if (!report) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No report found with this reference'
      })
    }

    if (!report.isAnonymous) {
      if (!report.email) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Verification required'
        })
      }
      if (!email || report.email.toLowerCase() !== email) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Email does not match this report reference'
        })
      }
    }

    const timeline = [
      {
        status: 'NEW',
        label: formatStatusLabel('NEW'),
        at: report.createdAt.toISOString()
      },
      ...report.updates.map((u) => ({
        status: u.status,
        label: formatStatusLabel(u.status, u.customStatus),
        at: u.createdAt.toISOString()
      }))
    ]

    return {
      reportNumber: report.reportNumber,
      status: report.status,
      statusLabel: formatStatusLabel(report.status, report.customStatus),
      lastUpdated: report.updatedAt.toISOString(),
      submittedAt: report.createdAt.toISOString(),
      timeline
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error.issues) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || 'Invalid request'
      })
    }
    console.error('[track report]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to look up report status'
    })
  }
})
