import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const updateReportSchema = z.object({
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'REFERRED_TO_PROSECUTION', 'CLOSED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can update reports
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can update reports'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Report ID is required'
      })
    }

    const body = await readBody(event)
    const data = updateReportSchema.parse(body)

    // Check if report exists
    const existing = await prisma.corruptionReport.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Report not found'
      })
    }

    // Prepare update data
    const updateData: any = {}
    if (data.status !== undefined) {
      updateData.status = data.status
      
      // Create status update entry
      await prisma.reportUpdate.create({
        data: {
          reportId: id,
          status: data.status,
          notes: data.notes || null,
          updatedBy: session.user.id
        }
      })
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority
    }
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo
    }
    if (data.notes !== undefined && !data.status) {
      // Only update notes if status is not being updated (to avoid duplicate update entry)
      updateData.notes = data.notes
    }

    // Update report
    const report = await prisma.corruptionReport.update({
      where: { id },
      data: updateData,
      include: {
        files: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        updates: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    return report
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    // Handle validation errors
    if (error.issues) {
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0]?.message || 'Validation error'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update report'
    })
  }
})

