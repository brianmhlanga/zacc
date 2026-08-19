import { prisma } from '../../../utils/prisma'
import { readMultipartFormData, createError } from 'h3'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_CV_BYTES = 5 * 1024 * 1024
const MAX_DOC_BYTES = 5 * 1024 * 1024
const MAX_DOCUMENTS = 10

const ALLOWED_CV_EXT = new Set(['pdf', 'doc', 'docx'])
const ALLOWED_DOC_EXT = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])

type MultipartItem = {
  name?: string
  filename?: string
  data: Buffer
}

function safeExtension(filename: string, fallback = 'bin'): string {
  const raw = (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return raw || fallback
}

/** Unique, filesystem-safe name; the original filename is kept in the database. */
function uniqueFileName(prefix: string, extension: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
}

export default defineEventHandler(async (event) => {
  // Files already written, so a later failure can clean up after itself.
  const writtenPaths: string[] = []

  try {
    const formData = (await readMultipartFormData(event)) as MultipartItem[] | undefined
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No form data received' })
    }

    const data: Record<string, string> = {}
    let cvFile: MultipartItem | null = null
    const documentFiles: MultipartItem[] = []
    const documentLabels: string[] = []

    for (const field of formData) {
      if (!field.name) continue

      if (field.filename) {
        if (field.name === 'cv') {
          cvFile = field
        } else if (field.name === 'documents' || field.name.startsWith('document')) {
          documentFiles.push(field)
        }
        continue
      }

      if (field.name === 'documentLabels') {
        documentLabels.push(field.data.toString('utf-8'))
      } else {
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

    const cvExtension = safeExtension(cvFile.filename || '')
    if (!ALLOWED_CV_EXT.has(cvExtension)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'CV must be a PDF, DOC or DOCX file'
      })
    }
    if (!cvFile.data?.length) {
      throw createError({ statusCode: 400, statusMessage: 'The uploaded CV is empty' })
    }
    if (cvFile.data.length > MAX_CV_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'CV is too large (max 5MB)' })
    }

    if (documentFiles.length > MAX_DOCUMENTS) {
      throw createError({
        statusCode: 400,
        statusMessage: `You can attach at most ${MAX_DOCUMENTS} supporting documents`
      })
    }

    for (const doc of documentFiles) {
      const fileName = doc.filename || 'unknown'
      const ext = safeExtension(fileName)
      if (!ALLOWED_DOC_EXT.has(ext)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Unsupported document type: .${ext} (${fileName})`
        })
      }
      if (!doc.data?.length) {
        throw createError({ statusCode: 400, statusMessage: `Empty document: ${fileName}` })
      }
      if (doc.data.length > MAX_DOC_BYTES) {
        throw createError({
          statusCode: 413,
          statusMessage: `Document too large (max 5MB): ${fileName}`
        })
      }
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

    // Shared uploads root, served through /api/uploads/<file>.
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const saveFile = async (item: MultipartItem, prefix: string) => {
      const extension = safeExtension(item.filename || '')
      const storedName = uniqueFileName(prefix, extension)
      const filePath = join(uploadsDir, storedName)
      await writeFile(filePath, item.data)
      writtenPaths.push(filePath)
      return { storedName, url: `/uploads/${storedName}`, extension }
    }

    const savedCv = await saveFile(cvFile, 'cv')

    const savedDocuments: Array<{
      fileName: string
      fileUrl: string
      fileSize: number
      fileType: string
      label: string | null
    }> = []

    for (const [index, doc] of documentFiles.entries()) {
      const saved = await saveFile(doc, 'application-doc')
      savedDocuments.push({
        fileName: doc.filename || saved.storedName,
        fileUrl: saved.url,
        fileSize: doc.data.length,
        fileType: saved.extension,
        label: documentLabels[index]?.trim() || null
      })
    }

    const parsedExperience = Number.parseInt(data.experience ?? '', 10)

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: data.jobId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        qualification: data.qualification || null,
        experience: Number.isNaN(parsedExperience) ? null : parsedExperience,
        coverLetter: data.coverLetter,
        cvUrl: savedCv.url,
        status: 'PENDING',
        documents: savedDocuments.length
          ? { create: savedDocuments }
          : undefined
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
      documentCount: savedDocuments.length,
      message: 'Your application has been submitted successfully. We will review it and contact you if you are shortlisted.'
    }
  } catch (error: any) {
    // Do not leave orphaned uploads behind when the application could not be saved.
    await Promise.all(
      writtenPaths.map((filePath) => unlink(filePath).catch(() => {}))
    )

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
