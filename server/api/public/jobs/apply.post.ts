import { prisma } from '../../../utils/prisma'
import { readMultipartFormData, createError } from 'h3'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'No form data received' })
    }

    const data: Record<string, any> = {}
    let cvFile: any = null

    for (const field of formData) {
      if (field.name === 'cv' && field.filename) {
        cvFile = field
      } else if (field.name) {
        data[field.name] = field.data.toString('utf-8')
      }
    }

    // Validate required fields
    if (!data.jobId || !data.name || !data.email || !data.phone || !data.coverLetter || !cvFile) {
      throw createError({
        statusCode: 400,
        statusMessage: 'All required fields must be provided'
      })
    }

    // Verify job exists and is still accepting applications
    const job = await prisma.job.findFirst({
      where: {
        id: data.jobId,
        isPublished: true,
        isActive: true,
        closingDate: {
          gte: new Date()
        }
      }
    })

    if (!job) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job not found or no longer accepting applications'
      })
    }

    // Handle CV file upload
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'applications')
    await fs.mkdir(uploadDir, { recursive: true })

    const uniqueFilename = `${uuidv4()}-${cvFile.filename}`
    const filePath = path.join(uploadDir, uniqueFilename)
    await fs.writeFile(filePath, cvFile.data)

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: data.jobId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        qualification: data.qualification || null,
        experience: data.experience ? parseInt(data.experience) : null,
        coverLetter: data.coverLetter,
        cvUrl: `/uploads/applications/${uniqueFilename}`,
        status: 'PENDING'
      }
    })

    // Update job application count
    await prisma.job.update({
      where: { id: data.jobId },
      data: {
        applicationCount: {
          increment: 1
        }
      }
    })

    return {
      id: application.id,
      message: 'Your application has been submitted successfully. We will review it and contact you if you are shortlisted.'
    }
  } catch (error: any) {
    console.error('Error submitting job application:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to submit application'
    })
  }
})

