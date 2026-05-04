import { z } from 'zod'
import { prisma } from '../../utils/prisma'

const statusEnum = z.enum([
  'NEW',
  'ACKNOWLEDGED',
  'UNDER_INVESTIGATION',
  'REFERRED_TO_PROSECUTION',
  'CLOSED',
  'ARCHIVED',
  'CUSTOM'
])

const updateReportSchema = z
  .object({
    status: statusEnum.optional(),
    customStatus: z.string().max(200).optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedTo: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isArchived: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    if (data.status === 'CUSTOM') {
      const label = data.customStatus?.trim()
      if (!label) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a label for the custom status',
          path: ['customStatus']
        })
      }
    }
  })

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'REPORTS_ADMIN'].includes(session.user.role)) {
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

    const existing = await prisma.corruptionReport.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Report not found'
      })
    }

    const updateData: Record<string, unknown> = {}

    if (data.status !== undefined) {
      updateData.status = data.status
      const customTrimmed =
        data.status === 'CUSTOM' ? (data.customStatus && data.customStatus.trim()) || null : null
      updateData.customStatus = customTrimmed

      await prisma.reportUpdate.create({
        data: {
          reportId: id,
          status: data.status,
          customStatus: customTrimmed,
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
    if (data.notes !== undefined && data.status === undefined) {
      updateData.notes = data.notes
    }
    if (data.isArchived !== undefined) {
      updateData.isArchived = data.isArchived
    }

    const report = await prisma.corruptionReport.update({
      where: { id },
      data: updateData as any,
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
