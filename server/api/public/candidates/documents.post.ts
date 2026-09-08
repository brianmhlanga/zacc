import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'node:crypto'
import { prisma } from '../../../utils/prisma'
import { requireCandidate } from '../../../utils/candidateAuth'

/**
 * Uploads one candidate document.
 *
 * Files land under `uploads/recruitment/<candidateId>/`. That prefix is what
 * puts them behind the access fence in `server/utils/protectedFiles.ts` — a CV
 * or an ID scan stored anywhere else would be world-readable.
 */
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip'])

function safeExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default defineEventHandler(async (event) => {
  try {
    const candidate = await requireCandidate(event)

    const form = await readMultipartFormData(event)
    const file = form?.find((f) => f.filename && f.data?.length)
    if (!file) throw createError({ statusCode: 400, statusMessage: 'No file received' })

    const ext = safeExtension(file.filename!)
    if (!ALLOWED.has(ext)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Unsupported file type: .${ext || 'unknown'}`
      })
    }
    if (file.data.length > MAX_BYTES) {
      throw createError({
        statusCode: 413,
        statusMessage: `File is too large (max ${MAX_BYTES / 1048576}MB)`
      })
    }

    // The stored name is a UUID: the original filename is kept in the database
    // and never used on disk, so a candidate cannot influence the path.
    const storedName = `${randomUUID()}.${ext}`
    const dir = join(process.cwd(), 'uploads', 'recruitment', candidate.id)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    await writeFile(join(dir, storedName), file.data)

    const fileUrl = `/uploads/recruitment/${candidate.id}/${storedName}`

    // Also recorded in the candidate's locker so it can be reused on a later
    // application without uploading again.
    const record = await prisma.candidateDocument.create({
      data: {
        candidateId: candidate.id,
        label: null,
        fileName: file.filename!,
        fileUrl,
        fileSize: file.data.length,
        fileType: ext
      },
      select: { id: true }
    })

    return {
      success: true,
      id: record.id,
      fileUrl,
      fileName: file.filename,
      fileSize: file.data.length,
      fileType: ext
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[candidates] document upload failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not upload the file' })
  }
})
