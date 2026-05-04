import { getRequestURL } from 'h3'
import { prisma } from '../../../utils/prisma'
import { notifyReportsInbox } from '../../../utils/mail'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { maskVoiceFirstLevel } from '../../../utils/voiceMaskFfmpeg'

const REPORT_NUMBER_REGEX = /^ZACC-(\d{4})-(\d{8})$/

const MAX_DOC_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 14 * 1024 * 1024 // ~3 min voice at typical webm bitrates

const ALLOWED_DOC_EXT = new Set([
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
  'xls',
  'xlsx'
])

function isUniqueConstraintError(error: any) {
  return error?.code === 'P2002' || String(error?.message || '').toLowerCase().includes('unique')
}

function safeExtension(filename: string, fallback = 'bin'): string {
  const raw = (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return raw || fallback
}

async function createReportWithCaseNumber(reportData: Record<string, any>) {
  const year = new Date().getFullYear()
  const prefix = `ZACC-${year}-`

  for (let attempt = 0; attempt < 20; attempt++) {
    const randomPart = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    const reportNumber = `${prefix}${randomPart}`
    if (!REPORT_NUMBER_REGEX.test(reportNumber)) continue
    try {
      return await prisma.corruptionReport.create({
        data: {
          ...reportData,
          reportNumber
        }
      })
    } catch (error: any) {
      if (isUniqueConstraintError(error)) continue
      throw error
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Unable to generate unique case number. Please try again.'
  })
}

type MultipartItem = {
  name?: string
  filename?: string
  data: Buffer
}

function isAudioField(name: string | undefined) {
  return name === 'audio' || name === 'audioRecording'
}

/** Any uploaded file part that is not the dedicated audio field. */
function isDocumentFilePart(item: MultipartItem) {
  if (!item.filename) return false
  return !isAudioField(item.name)
}

function parseTextFields(items: MultipartItem[]) {
  const fields: Record<string, any> = {}
  for (const item of items) {
    if (item.filename) continue
    const fieldName = item.name || ''
    if (!fieldName) continue
    const fieldValue = item.data.toString('utf8')

    if (fieldName === 'isAnonymous') {
      fields[fieldName] = fieldValue === 'true'
    } else if (fieldName === 'incidentDate') {
      fields[fieldName] = fieldValue ? new Date(fieldValue) : null
    } else {
      // Keep empty strings so we do not drop fields when multipart order or clients differ
      fields[fieldName] = fieldValue
    }
  }
  return fields
}

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received'
      })
    }

    const items = formData as MultipartItem[]
    const fields = parseTextFields(items)

    const docParts = items.filter(isDocumentFilePart)
    const audioPart = items.find((i) => i.filename && isAudioField(i.name))

    function assertUploadsAllowed() {
      for (const part of docParts) {
        const fileName = part.filename || 'unknown'
        const ext = safeExtension(fileName)
        if (!ALLOWED_DOC_EXT.has(ext)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Unsupported file type: .${ext} (${fileName})`
          })
        }
        const size = part.data?.length ?? 0
        if (size <= 0) {
          throw createError({
            statusCode: 400,
            statusMessage: `Empty file upload: ${fileName}`
          })
        }
        if (size > MAX_DOC_BYTES) {
          throw createError({
            statusCode: 413,
            statusMessage: `File too large (max ${MAX_DOC_BYTES / (1024 * 1024)}MB): ${fileName}`
          })
        }
      }
      if (audioPart?.data?.length) {
        if (audioPart.data.length > MAX_AUDIO_BYTES) {
          throw createError({
            statusCode: 413,
            statusMessage: 'Audio recording is too large (max about 3 minutes).'
          })
        }
      }
    }

    assertUploadsAllowed()

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

    if (
      !String(reportData.corruptionType || '').trim() ||
      !String(reportData.incidentDescription || '').trim() ||
      !String(reportData.location || '').trim()
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required report fields'
      })
    }

    if (!reportData.isAnonymous) {
      reportData.name = fields.name || null
      reportData.email = fields.email || null
      reportData.phone = fields.phone || null
      reportData.organization = fields.organization || null
    }

    const report = await createReportWithCaseNumber(reportData)

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'reports')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const saveDocument = async (item: MultipartItem) => {
      const fileName = item.filename || 'unknown'
      const fileExtension = safeExtension(fileName)
      const size = item.data?.length ?? 0

      const uniqueFileName = `${report.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExtension}`
      const filePath = join(uploadsDir, uniqueFileName)
      const fileUrl = `/uploads/reports/${uniqueFileName}`

      await writeFile(filePath, item.data)

      return prisma.reportFile.create({
        data: {
          reportId: report.id,
          fileName: fileName,
          fileUrl,
          fileSize: size,
          fileType: fileExtension
        }
      })
    }

    if (docParts.length > 0) {
      for (const part of docParts) {
        await saveDocument(part)
      }
    }

    let audioUrl: string | null = null
    let audioProcessingFailed = false
    if (audioPart?.data?.length) {
      const outFileName = `${report.id}-audio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.ogg`
      const outPath = join(uploadsDir, outFileName)
      const publicUrl = `/uploads/reports/${outFileName}`
      const extIn = safeExtension(audioPart.filename || 'recording.webm')

      // Client already ran FFmpeg via /voice-preview — store bytes as-is (no raw retained)
      const isPreMaskedOgg = extIn === 'ogg' || extIn === 'oga'
      if (isPreMaskedOgg) {
        try {
          await writeFile(outPath, audioPart.data)
          audioUrl = publicUrl
          await prisma.corruptionReport.update({
            where: { id: report.id },
            data: { audioUrl }
          })
        } catch (err) {
          console.error('[reports] saving pre-masked audio failed', err)
          audioProcessingFailed = true
          await unlink(outPath).catch(() => {})
        }
      } else {
        const tmpDir = join(process.cwd(), 'tmp', 'audio')
        await mkdir(tmpDir, { recursive: true })
        const tmpName = `${report.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webm`
        const tmpIn = join(tmpDir, tmpName)
        await writeFile(tmpIn, audioPart.data)

        try {
          await maskVoiceFirstLevel(tmpIn, outPath)
          await unlink(tmpIn).catch(() => {})
          audioUrl = publicUrl
          await prisma.corruptionReport.update({
            where: { id: report.id },
            data: { audioUrl }
          })
        } catch (err) {
          console.error('[reports] ffmpeg voice mask failed', err)
          audioProcessingFailed = true
          await unlink(tmpIn).catch(() => {})
          await unlink(outPath).catch(() => {})
        }
      }
    }

    const response: any = {
      id: report.id,
      reportNumber: report.reportNumber,
      status: report.status,
      createdAt: report.createdAt,
      audioUrl,
      audioProcessingFailed
    }

    if (!report.isAnonymous) {
      response.name = report.name
      response.email = report.email
    }

    const origin = getRequestURL(event).origin
    const adminReportsUrl = `${origin}/admin/reports`
    void notifyReportsInbox({
      reportNumber: report.reportNumber,
      adminReportsUrl
    }).catch((err) => console.error('[reports] notify inbox failed', err))

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
