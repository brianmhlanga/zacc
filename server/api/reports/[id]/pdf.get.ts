import { prisma } from '../../../utils/prisma'
import { buildCorruptionReportPdf } from '../../../utils/buildCorruptionReportPdf'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Report ID is required'
    })
  }

  const report = await prisma.corruptionReport.findUnique({
    where: { id },
    include: {
      files: {
        orderBy: { uploadedAt: 'desc' }
      },
      updates: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Report not found'
    })
  }

  let assignedToLabel: string | undefined
  if (report.assignedTo) {
    const assignee = await prisma.user.findUnique({
      where: { id: report.assignedTo },
      select: { name: true, email: true }
    })
    if (assignee) {
      assignedToLabel = (assignee.name && assignee.name.trim()) || assignee.email
    }
  }

  let buffer: Buffer
  try {
    buffer = await buildCorruptionReportPdf(report, { assignedToLabel })
  } catch (e) {
    console.error('[reports/pdf]', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate PDF'
    })
  }

  const safeName = `ZACC-report-${report.reportNumber.replace(/[^a-zA-Z0-9-_]+/g, '_')}`
  setResponseHeader(event, 'content-type', 'application/pdf')
  setResponseHeader(event, 'content-disposition', `attachment; filename="${safeName}.pdf"`)
  return buffer
})
