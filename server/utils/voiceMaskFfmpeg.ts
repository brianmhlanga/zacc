import { execFile, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

let cachedFfmpegBin: string | null = null

function resolveBundledFfmpeg(): string | null {
  try {
    const pkgJson = require.resolve('ffmpeg-static/package.json')
    const dir = dirname(pkgJson)
    const name = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    const direct = join(dir, name)
    if (existsSync(direct)) {
      return direct
    }
    try {
      const exported = require('ffmpeg-static') as string
      if (typeof exported === 'string' && exported.length > 0 && existsSync(exported)) {
        return exported
      }
    } catch {
      /* ignore */
    }
    console.warn(
      `[voiceMaskFfmpeg] ffmpeg-static package resolved but binary missing at ${direct}. ` +
        'If you built on another OS, rebuild on Linux or run `npm install` on this server, or install system ffmpeg.'
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[voiceMaskFfmpeg] ffmpeg-static not available:', msg)
  }
  return null
}

/** PM2/systemd often provide a minimal PATH; common locations still work. */
function resolveWellKnownSystemFfmpeg(): string | null {
  if (process.platform === 'win32') {
    return null
  }
  const paths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/snap/bin/ffmpeg']
  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      execFileSync(p, ['-hide_banner', '-version'], { stdio: 'ignore' })
      return p
    } catch {
      /* try next */
    }
  }
  return null
}

/**
 * Resolve ffmpeg: `FFMPEG_PATH`, then `ffmpeg` on PATH, then well-known absolute paths,
 * then `ffmpeg-static` from npm.
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

  const system = resolveWellKnownSystemFfmpeg()
  if (system) {
    cachedFfmpegBin = system
    return cachedFfmpegBin
  }

  const bundled = resolveBundledFfmpeg()
  if (bundled) {
    cachedFfmpegBin = bundled
    return cachedFfmpegBin
  }

  throw new Error(
    'FFmpeg not found. On the server: `apt install ffmpeg` (or set FFMPEG_PATH to the binary). ' +
      'If you deploy only .output, build on Linux or run `npm install` inside .output/server on Linux so ffmpeg-static downloads the linux binary.'
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
