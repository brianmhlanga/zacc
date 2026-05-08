import { readFile } from 'fs/promises'
import { join, normalize, resolve, sep } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    const pathParam = getRouterParam(event, 'path')
    if (!pathParam) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File path is required'
      })
    }

    // Security: prevent directory traversal
    if (pathParam.includes('..')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file path'
      })
    }

    // Normalize and validate relative path (supports nested folders like reports/audio)
    const normalizedRelativePath = normalize(pathParam.replace(/\\/g, '/'))
      .replace(/^\/+/, '')

    if (!normalizedRelativePath || normalizedRelativePath.includes('\0')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file path'
      })
    }

    const uploadsRoot = resolve(process.cwd(), 'uploads')
    const filePath = resolve(uploadsRoot, normalizedRelativePath)

    // Security: ensure resolved path stays within uploads root
    if (filePath !== uploadsRoot && !filePath.startsWith(uploadsRoot + sep)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file path'
      })
    }
    
    // Check if file exists
    if (!existsSync(filePath)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }

    // Read file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain'
    }
    const contentType = contentTypeMap[extension || ''] || 'application/octet-stream'

    // Set headers
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    setHeader(event, 'Content-Length', fileBuffer.length.toString())
    
    // Return the buffer directly - H3 will handle binary data correctly
    return fileBuffer
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve file'
    })
  }
})

