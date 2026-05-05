import { execFile, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

let cachedFfmpegBin: string | null = null

function resolveBundledFfmpeg(): string | null {
  try {
    const p = require('ffmpeg-static') as string
    if (typeof p === 'string' && p.length > 0 && existsSync(p)) {
      return p
    }
  } catch {
    /* optional dependency missing or unsupported platform */
  }
  return null
}

/**
 * Resolve ffmpeg: `FFMPEG_PATH`, then system `ffmpeg` on PATH, then `ffmpeg-static` from npm.
 */
export function getFfmpegBinary(): string {
  if (cachedFfmpegBin) {
    return cachedFfmpegBin
  }

  const fromEnv = process.env.FFMPEG_PATH?.trim()
  if (fromEnv && existsSync(fromEnv)) {
    cachedFfmpegBin = fromEnv
    return cachedFfmpegBin
  }

  const candidates = process.platform === 'win32' ? ['ffmpeg.exe', 'ffmpeg'] : ['ffmpeg']

  for (const bin of candidates) {
    try {
      execFileSync(bin, ['-hide_banner', '-version'], { stdio: 'ignore' })
      cachedFfmpegBin = bin
      return cachedFfmpegBin
    } catch {
      /* try next */
    }
  }

  const bundled = resolveBundledFfmpeg()
  if (bundled) {
    cachedFfmpegBin = bundled
    return cachedFfmpegBin
  }

  throw new Error(
    'FFmpeg not found. Install ffmpeg on PATH, set FFMPEG_PATH, or ensure the ffmpeg-static package installed correctly (npm install).'
  )
}

/**
 * First-level voice masking: mono, mild pitch shift, band-limit, light compression,
 * metadata stripped, Opus output.
 */
export async function maskVoiceFirstLevel(inputPath: string, outputPath: string) {
  const ffmpeg = getFfmpegBinary()

  const audioFilter = [
    'aformat=channel_layouts=mono',
    'volume=1.1',
    'asetrate=44100*0.9',
    'aresample=44100',
    'highpass=f=180',
    'lowpass=f=5000',
    'acompressor=threshold=-18dB:ratio=2:attack=20:release=200'
  ].join(',')

  let stderr: string | Buffer | undefined
  try {
    const result = await execFileAsync(
      ffmpeg,
      [
        '-y',
        '-i',
        inputPath,
        '-af',
        audioFilter,
        '-map_metadata',
        '-1',
        '-vn',
        '-c:a',
        'libopus',
        '-b:a',
        '48k',
        outputPath
      ],
      { maxBuffer: 10 * 1024 * 1024 }
    )
    stderr = result.stderr
  } catch (err: any) {
    const stderrStr = err?.stderr?.toString?.()
    const tail = stderrStr?.slice?.(-900)?.trim?.()
    if (tail) {
      console.error('[voiceMaskFfmpeg] ffmpeg stderr (tail):', tail)
    }
    const msg = stderrStr || err?.message || String(err)
    const wrapped = new Error(`ffmpeg failed: ${msg}`)
    ;(wrapped as any).cause = err
    throw wrapped
  }

  if (stderr && process.env.NODE_ENV === 'development') {
    const okTail = stderr.toString().slice(-400)
    if (okTail.trim()) {
      console.debug('[voiceMaskFfmpeg] ffmpeg stderr (tail):', okTail)
    }
  }
}
