import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Only ADMIN, SUPER_ADMIN, and EDITOR can upload files
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Only administrators and editors can upload files'
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (file.type && !allowedTypes.includes(file.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only images are allowed.'
      })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size exceeds 5MB limit'
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
    const fileExtension = file.filename.split('.').pop()
    const newFilename = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = join(uploadsDir, newFilename)

    // Write file to disk
    await writeFile(filePath, file.data)

    // Return the file path relative to the uploads directory
    return {
      success: true,
      filename: newFilename,
      path: `/api/uploads/${newFilename}`,
      size: file.data.length,
      type: file.type
    }
  } catch (error: any) {
    console.error('Error uploading file:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload file'
    })
  }
})

