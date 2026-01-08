import { prisma } from '../../../utils/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    // Handle multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received'
      })
    }

    // Extract form fields from multipart data
    const fields: any = {}
    const files: any[] = []

    formData.forEach((item) => {
      if (item.filename) {
        // It's a file
        files.push(item)
      } else {
        // It's a field
        const fieldName = item.name || ''
        const fieldValue = item.data.toString()
        
        if (fieldName === 'isAnonymous') {
          fields[fieldName] = fieldValue === 'true'
        } else if (fieldName === 'incidentDate' && fieldValue) {
          fields[fieldName] = new Date(fieldValue)
        } else if (fieldValue) {
          fields[fieldName] = fieldValue
        }
      }
    })

    // Extract form fields
    const reportData: any = {
      isAnonymous: fields.isAnonymous !== false,
      corruptionType: fields.corruptionType,
      incidentDescription: fields.incidentDescription,
      location: fields.location,
      province: fields.province || null,
      incidentDate: fields.incidentDate || null,
      incidentTime: fields.incidentTime || null,
      peopleInvolved: fields.peopleInvolved || null,
      additionalInfo: fields.additionalInfo || null,
      status: 'NEW',
      priority: 'MEDIUM'
    }

    // Add contact info only if not anonymous
    if (!reportData.isAnonymous) {
      reportData.name = fields.name || null
      reportData.email = fields.email || null
      reportData.phone = fields.phone || null
      reportData.organization = fields.organization || null
    }

    // Create the report
    const report = await prisma.corruptionReport.create({
      data: reportData
    })

    // Handle file uploads if any
    if (files.length > 0) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'reports')
      
      // Ensure uploads directory exists
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const filePromises = files.map(async (item) => {
        const fileName = item.filename || 'unknown'
        const fileExtension = fileName.split('.').pop() || ''
        const uniqueFileName = `${report.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
        const filePath = join(uploadsDir, uniqueFileName)
        const fileUrl = `/uploads/reports/${uniqueFileName}`

        // Write file to disk
        await writeFile(filePath, item.data)

        // Get file size and type
        const fileSize = item.data.length
        const fileType = fileExtension.toLowerCase()

        // Create report file record
        return prisma.reportFile.create({
          data: {
            reportId: report.id,
            fileName: fileName,
            fileUrl: fileUrl,
            fileSize: fileSize,
            fileType: fileType
          }
        })
      })

      await Promise.all(filePromises)
    }

    // Return the created report (without sensitive info if anonymous)
    const response: any = {
      id: report.id,
      reportNumber: report.reportNumber,
      status: report.status,
      createdAt: report.createdAt
    }

    if (!report.isAnonymous) {
      response.name = report.name
      response.email = report.email
    }

    return response
  } catch (error: any) {
    console.error('Error creating report:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit report. Please try again or contact us directly.'
    })
  }
})

