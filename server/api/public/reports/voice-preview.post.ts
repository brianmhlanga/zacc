import { writeFile, mkdir, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { maskVoiceFirstLevel } from '../../../utils/voiceMaskFfmpeg'

const MAX_AUDIO_BYTES = 14 * 1024 * 1024

function isAudioField(name: string | undefined) {
  return name === 'audio' || name === 'audioRecording'
}

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No form data received' })
  }

  const audioPart = formData.find((i) => i.filename && isAudioField(i.name))
  if (!audioPart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No audio file uploaded' })
  }
  if (audioPart.data.length > MAX_AUDIO_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Audio file is too large' })
  }

  const tmpDir = join(process.cwd(), 'tmp', 'audio')
  await mkdir(tmpDir, { recursive: true })
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const tmpIn = join(tmpDir, `preview-in-${stamp}.webm`)
  const tmpOut = join(tmpDir, `preview-out-${stamp}.ogg`)

  await writeFile(tmpIn, audioPart.data)

  try {
    await maskVoiceFirstLevel(tmpIn, tmpOut)
    const buf = await readFile(tmpOut)
    await unlink(tmpIn).catch(() => {})
    await unlink(tmpOut).catch(() => {})

    setResponseHeader(event, 'content-type', 'audio/ogg; codecs=opus')
    setResponseHeader(event, 'cache-control', 'no-store')
    return buf
  } catch (err) {
    console.error('[voice-preview] ffmpeg failed', err)
    await unlink(tmpIn).catch(() => {})
    await unlink(tmpOut).catch(() => {})
    throw createError({
      statusCode: 503,
      statusMessage: 'Voice preview failed. Is ffmpeg installed on the server?'
    })
  }
})
