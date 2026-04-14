import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getSupplierFromRequest } from '../../utils/supplierAuth'

export default defineEventHandler(async (event) => {
  try {
    // Allow authenticated admin/editor users OR authenticated suppliers.
    const session = await getUserSession(event)
    const supplier = await getSupplierFromRequest(event)
    const hasBackofficeAccess = Boolean(session.user && ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role))
    const hasSupplierAccess = Boolean(supplier)
    if (!hasBackofficeAccess && !hasSupplierAccess) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided'
      })
    }

    const file = formData[0]
    if (!file.data || !file.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file'
      })
    }

    // Validate file type - allow documents
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain'
    ]
    
    // Also check by extension for better compatibility
    const fileExtension = file.filename.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    
    if (file.type && !allowedTypes.includes(file.type) && (!fileExtension || !allowedExtensions.includes(fileExtension))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT) are allowed.'
      })
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size exceeds 50MB limit'
      })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const newFilename = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = join(uploadsDir, newFilename)

    // Write file to disk
    await writeFile(filePath, file.data)

    // Determine file type from extension
    const fileTypeMap: Record<string, string> = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'xls': 'xls',
      'xlsx': 'xlsx',
      'ppt': 'ppt',
      'pptx': 'pptx',
      'txt': 'txt'
    }
    const detectedFileType = fileTypeMap[fileExtension || ''] || fileExtension || 'unknown'

    // Return the file path relative to the uploads directory
    return {
      success: true,
      filename: newFilename,
      path: `/api/uploads/${newFilename}`,
      size: file.data.length,
      type: file.type || 'application/octet-stream',
      fileType: detectedFileType
    }
  } catch (error: any) {
    console.error('Error uploading document:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload document'
    })
  }
})

