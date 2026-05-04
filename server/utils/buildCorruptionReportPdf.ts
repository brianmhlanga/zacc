import PDFDocument from 'pdfkit'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { htmlToPlainText } from './htmlToPlainText'

export type CorruptionReportPdfInput = {
  reportNumber: string
  isAnonymous: boolean
  name: string | null
  email: string | null
  phone: string | null
  organization: string | null
  corruptionType: string
  incidentDescription: string
  location: string
  province: string | null
  incidentDate: Date | string | null
  incidentTime: string | null
  peopleInvolved: string | null
  additionalInfo: string | null
  audioUrl: string | null
  status: string
  customStatus?: string | null
  priority: string
  assignedTo: string | null
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
  files: Array<{ fileName: string; fileUrl: string; fileSize: number; fileType: string }>
  updates: Array<{
    status: string
    customStatus?: string | null
    notes: string | null
    createdAt: Date | string
  }>
}

/** ZACC brand (aligned with site Tailwind tokens) */
const BRAND = {
  green: '#209341',
  greenDark: '#14532d',
  gold: '#d4af37',
  goldDark: '#a16207',
  paper: '#ffffff',
  panel: '#f1f5f9',
  panelBorder: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  link: '#166534'
}

/** Public site for absolute links in PDFs (matches production site). */
function publicOrigin(): string {
  const raw = (process.env.NUXT_PUBLIC_SITE_URL || 'https://zacc.co.zw').trim()
  return raw.replace(/\/+$/, '')
}

/** Turn stored URLs (often `/uploads/...`) into absolute https links for the PDF. */
function toPublicUrl(href: string | null | undefined): string {
  if (!href?.trim()) return ''
  const h = href.trim()
  if (/^https?:\/\//i.test(h)) return h
  if (h.startsWith('//')) return `https:${h}`
  const path = h.startsWith('/') ? h : `/${h}`
  return `${publicOrigin()}${path}`
}

function resolveLogoPath(): string | null {
  const cwd = process.cwd()
  const candidates = [
    join(cwd, 'public', 'logo.png'),
    join(cwd, '.output', 'public', 'logo.png'),
    join(cwd, 'app', 'assets', 'logo.png')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

function formatReportLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function displayReportStatus(status: string, custom?: string | null) {
  if (status === 'CUSTOM' && custom?.trim()) {
    return custom.trim()
  }
  return formatReportLabel(status)
}

function formatProvinceSlug(slug: string | null | undefined) {
  if (!slug) return ''
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatWhen(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

export function buildCorruptionReportPdf(
  report: CorruptionReportPdfInput,
  opts: { assignedToLabel?: string | null } = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const margin = 48
    const doc = new PDFDocument({
      size: 'A4',
      margin: margin,
      bufferPages: false,
      info: {
        Title: `ZACC Report ${report.reportNumber}`,
        Author: 'Zimbabwe Anti-Corruption Commission'
      }
    })

    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageW = doc.page.width
    const contentW = pageW - margin * 2

    doc.on('pageAdded', () => {
      doc.rect(0, 0, pageW, 3).fill(BRAND.gold)
      doc.rect(0, 3, pageW, 5).fill(BRAND.green)
      doc.fillColor(BRAND.text)
      doc.x = margin
      doc.y = 28
    })

    function drawFirstPageHeader() {
      const headerGreenH = 78
      doc.rect(0, 0, pageW, 4).fill(BRAND.gold)
      doc.rect(0, 4, pageW, headerGreenH).fill(BRAND.green)

      const lx = margin
      const ly = 18
      const logoPath = resolveLogoPath()
      const tile = 58
      doc.roundedRect(lx, ly, tile, tile, 8).fill(BRAND.paper)

      if (logoPath) {
        try {
          doc.image(logoPath, lx + 5, ly + 5, { width: tile - 10, height: tile - 10 })
        } catch {
          /* ignore corrupt / unsupported image */
        }
      }

      const textX = lx + tile + 14
      const textW = pageW - textX - margin
      doc.fillColor(BRAND.paper).font('Helvetica-Bold').fontSize(20)
      doc.text('Corruption report', textX, ly + 6, { width: textW, lineGap: 2 })
      doc.font('Helvetica').fontSize(9.5).opacity(0.92)
      doc.text('Zimbabwe Anti-Corruption Commission', textX, ly + 32, { width: textW })
      doc.opacity(1)
      doc.font('Helvetica-Bold').fontSize(11)
      doc.text(`Reference  ${report.reportNumber}`, textX, ly + 48, { width: textW })

      const bandY = 4 + headerGreenH
      const bandH = 40
      doc.rect(0, bandY, pageW, bandH).fill(BRAND.panel)
      doc.strokeColor(BRAND.panelBorder).lineWidth(0.5)
      doc.moveTo(0, bandY + bandH).lineTo(pageW, bandY + bandH).stroke()

      doc.fillColor(BRAND.textMuted).font('Helvetica-Bold').fontSize(7.5)
      doc.text('SUBMITTED', margin, bandY + 10, { width: contentW / 2 - 8 })
      doc.text('LAST UPDATED', margin + contentW / 2, bandY + 10, { width: contentW / 2 - 8 })

      doc.fillColor(BRAND.text).font('Helvetica-Bold').fontSize(10)
      doc.text(formatWhen(report.createdAt) || '—', margin, bandY + 22, { width: contentW / 2 - 8 })
      doc.text(formatWhen(report.updatedAt) || '—', margin + contentW / 2, bandY + 22, {
        width: contentW / 2 - 8
      })

      doc.fillColor(BRAND.text).font('Helvetica').fontSize(8).opacity(0.85)
      doc.text(`PDF generated ${formatWhen(new Date())}`, margin, bandY + bandH - 12, {
        width: contentW,
        align: 'right'
      })
      doc.opacity(1)

      doc.x = margin
      doc.y = bandY + bandH + 20
    }

    function drawFooter() {
      const y0 = doc.page.height - margin - 28
      doc.save()
      doc.font('Helvetica').fontSize(7.5).fillColor(BRAND.textMuted)
      doc.text('Zimbabwe Anti-Corruption Commission', margin, y0, {
        width: contentW,
        align: 'center'
      })
      doc.text('Confidential — internal case material', margin, y0 + 10, {
        width: contentW,
        align: 'center'
      })
      doc.fillColor(BRAND.green).font('Helvetica-Bold').fontSize(7)
      doc.text(publicOrigin().replace(/^https:\/\//, ''), margin, y0 + 20, {
        width: contentW,
        align: 'center'
      })
      doc.restore()
    }

    function section(title: string, fn: () => void) {
      doc.moveDown(0.35)
      const y0 = doc.y
      const barH = 24
      doc.save()
      doc.roundedRect(margin, y0, contentW, barH, 4).fill(BRAND.green)
      doc.rect(margin, y0, 5, barH).fill(BRAND.gold)
      doc.fillColor(BRAND.paper).font('Helvetica-Bold').fontSize(11.5)
      doc.text(title, margin + 14, y0 + 7, { width: contentW - 20 })
      doc.restore()
      doc.y = y0 + barH + 12
      doc.x = margin
      doc.fillColor(BRAND.text).font('Helvetica').fontSize(10)
      fn()
    }

    function kv(label: string, value: string | null | undefined) {
      const v = value && String(value).trim() ? String(value).trim() : '—'
      doc.fillColor(BRAND.textMuted).font('Helvetica-Bold').fontSize(7.5)
      doc.text(label.toUpperCase(), { width: contentW })
      doc.moveDown(0.08)
      doc.fillColor(BRAND.text).font('Helvetica').fontSize(10)
      doc.text(v, { width: contentW, lineGap: 2 })
      doc.moveDown(0.35)
    }

    function kvInlineRow(left: [string, string], right: [string, string]) {
      const gap = 18
      const half = (contentW - gap) / 2
      const y = doc.y
      doc.fillColor(BRAND.textMuted).font('Helvetica-Bold').fontSize(7.5)
      doc.text(left[0].toUpperCase(), margin, y, { width: half })
      doc.text(right[0].toUpperCase(), margin + half + gap, y, { width: half })
      const y2 = y + 11
      doc.fillColor(BRAND.text).font('Helvetica').fontSize(10)
      doc.text(left[1] || '—', margin, y2, { width: half })
      doc.text(right[1] || '—', margin + half + gap, y2, { width: half })
      doc.y = y2 + 22
      doc.x = margin
    }

    function prose(text: string) {
      doc.fillColor(BRAND.text).font('Helvetica').fontSize(10).lineGap(3)
      doc.text(text || '—', { width: contentW, align: 'left' })
      doc.moveDown(0.25)
    }

    function linkLine(raw: string) {
      const absolute = toPublicUrl(raw)
      doc.fillColor(BRAND.link).font('Helvetica').fontSize(9)
      doc.text(absolute, { width: contentW, link: absolute, underline: true })
      doc.fillColor(BRAND.text)
      doc.moveDown(0.25)
    }

    function pillRow(items: { label: string; value: string }[]) {
      const n = Math.max(1, items.length)
      const gap = 8
      const w = (contentW - gap * (n - 1)) / n
      const y0 = doc.y
      const pillH = 38
      let x = margin
      for (const it of items) {
        doc.save()
        doc.roundedRect(x, y0, w, pillH, 7).fill(BRAND.panel)
        doc.strokeColor(BRAND.panelBorder).lineWidth(0.5)
        doc.roundedRect(x, y0, w, pillH, 7).stroke()
        doc.fillColor(BRAND.textMuted).font('Helvetica-Bold').fontSize(6.5)
        doc.text(it.label.toUpperCase(), x + 10, y0 + 8, { width: w - 20 })
        doc.fillColor(BRAND.greenDark).font('Helvetica-Bold').fontSize(9.5)
        doc.text(it.value, x + 10, y0 + 20, { width: w - 20 })
        doc.restore()
        x += w + gap
      }
      doc.y = y0 + pillH + 12
      doc.x = margin
    }

    /** Timeline entry — no full-height vertical line (avoids cross-page vector glitches / blank pages). */
    function timelineItem(when: string, statusTitle: string, notes: string | null) {
      const inset = 14
      const y0 = doc.y + 2
      doc.save()
      doc.roundedRect(margin + 2, y0 + 2, 5, 5, 1).fill(BRAND.gold)
      doc.restore()
      doc.x = margin + inset
      doc.y = y0
      doc.fillColor(BRAND.textMuted).font('Helvetica-Bold').fontSize(7.5)
      doc.text(when.toUpperCase(), { width: contentW - inset })
      doc.fillColor(BRAND.green).font('Helvetica-Bold').fontSize(10)
      doc.text(statusTitle, { width: contentW - inset })
      if (notes?.trim()) {
        doc.fillColor(BRAND.text).font('Helvetica').fontSize(9).lineGap(2)
        doc.text(htmlToPlainText(notes), { width: contentW - inset })
      }
      doc.moveDown(0.45)
      doc.x = margin
    }

    drawFirstPageHeader()

    section('Case summary', () => {
      pillRow([
        { label: 'Status', value: displayReportStatus(report.status, report.customStatus) },
        { label: 'Priority', value: formatReportLabel(report.priority) },
        {
          label: 'Assigned',
          value: opts.assignedToLabel || (report.assignedTo ? `User ${report.assignedTo}` : '—')
        }
      ])
      kvInlineRow(['Submitted', formatWhen(report.createdAt)], ['Last updated', formatWhen(report.updatedAt)])
    })

    section('Reporter & contact', () => {
      kv('Anonymous submission', report.isAnonymous ? 'Yes' : 'No')
      if (!report.isAnonymous) {
        kv('Full name', report.name)
        kv('Email', report.email)
        kv('Phone', report.phone)
      }
      kv('Organisation', report.organization)
    })

    section('Incident', () => {
      kv('Corruption type', formatReportLabel(report.corruptionType))
      const loc =
        report.location +
        (report.province ? ` · ${formatProvinceSlug(report.province)}` : '')
      kv('Location', loc)
      if (report.incidentDate) {
        kv(
          'Incident date & time',
          formatWhen(report.incidentDate) + (report.incidentTime ? ` · ${report.incidentTime}` : '')
        )
      }
    })

    section('Description', () => {
      prose(htmlToPlainText(report.incidentDescription))
    })

    if (report.peopleInvolved?.trim()) {
      section('People involved', () => {
        prose(htmlToPlainText(report.peopleInvolved))
      })
    }

    if (report.additionalInfo?.trim()) {
      section('Additional information', () => {
        prose(htmlToPlainText(report.additionalInfo))
      })
    }

    if (report.notes?.trim()) {
      section('Internal notes', () => {
        doc.fillColor(BRAND.goldDark).font('Helvetica-Bold').fontSize(8)
        doc.text('For official use — handle in line with ZACC policies.', { width: contentW })
        doc.moveDown(0.35)
        doc.fillColor(BRAND.text).font('Helvetica').fontSize(10)
        prose(htmlToPlainText(report.notes))
      })
    }

    if (report.audioUrl) {
      section('Voice note', () => {
        doc
          .fillColor(BRAND.textMuted)
          .font('Helvetica')
          .fontSize(9)
          .text(
            'Audio is not embedded in this PDF. Open the link in a browser to listen or download.',
            { width: contentW }
          )
        doc.moveDown(0.35)
        linkLine(report.audioUrl)
      })
    }

    if (report.files?.length) {
      section('Attached files', () => {
        for (const f of report.files) {
          doc.fillColor(BRAND.text).font('Helvetica-Bold').fontSize(10)
          doc.text(f.fileName, { width: contentW })
          doc.fillColor(BRAND.textMuted).font('Helvetica').fontSize(8.5)
          doc.text(`${formatFileSize(f.fileSize)} · ${f.fileType}`, { width: contentW })
          doc.moveDown(0.12)
          linkLine(f.fileUrl)
          doc.strokeColor(BRAND.panelBorder).lineWidth(0.75)
          doc.moveTo(margin, doc.y + 4).lineTo(margin + contentW, doc.y + 4).stroke()
          doc.moveDown(0.55)
        }
      })
    }

    const updatesChrono = [...(report.updates || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    if (updatesChrono.length) {
      section('Status history', () => {
        for (const u of updatesChrono) {
          timelineItem(
            formatWhen(u.createdAt),
            displayReportStatus(u.status, u.customStatus),
            u.notes
          )
        }
      })
    }

    drawFooter()
    doc.end()
  })
}
