/**
 * A small {{placeholder}} renderer for back-office-editable notification templates.
 *
 * Nothing in this repo interpolates templates today — the one existing HTML email
 * is a JS template literal in `mail.ts`. Pulling in Handlebars (~80KB plus a
 * compiler that builds functions at runtime) to substitute a dozen tokens into an
 * HR email is disproportionate, so this is deliberately ~120 lines.
 *
 * Design notes:
 *  - Output is HTML-escaped by default. Template authors are HR staff, but the
 *    *values* include candidate-supplied text, so `{{firstName}}` must never be
 *    able to inject markup. `{{{token}}}` opts out for pre-sanitised HTML.
 *  - Unresolved tokens render empty and are collected in `missing`, so a template
 *    with a typo sends a slightly bare email rather than mailing a candidate the
 *    literal string "{{firstName}}".
 */

export interface RenderResult {
  output: string
  /** Paths referenced by the template that had no value. */
  missing: string[]
}

export type TemplateVars = Record<string, unknown>

const EACH = /\{\{#each\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g
const IF = /\{\{#if\s+([\w.]+)\s*\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g
const TOKEN = /\{\{\{\s*([\w.]+)(?:\s*\|\s*(\w+))?\s*\}\}\}|\{\{\s*([\w.]+)(?:\s*\|\s*(\w+))?\s*\}\}/g

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

const fmt = (value: unknown, opts: Intl.DateTimeFormatOptions): string => {
  const d = toDate(value)
  return d ? d.toLocaleString('en-GB', opts) : ''
}

const FILTERS: Record<string, (v: unknown) => string> = {
  date: (v) => fmt(v, { day: '2-digit', month: 'long', year: 'numeric' }),
  datetime: (v) =>
    fmt(v, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  time: (v) => fmt(v, { hour: '2-digit', minute: '2-digit' }),
  day: (v) => fmt(v, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
  upper: (v) => String(v ?? '').toUpperCase(),
  lower: (v) => String(v ?? '').toLowerCase(),
  title: (v) =>
    String(v ?? '')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  number: (v) => Number(v ?? 0).toLocaleString('en-GB'),
  money: (v) =>
    `USD ${Number(v ?? 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
}

function lookup(vars: TemplateVars, path: string): unknown {
  return path
    .split('.')
    .reduce<any>((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), vars)
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return value !== 0
  return Boolean(value)
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function renderTemplate(
  template: string,
  vars: TemplateVars,
  opts: { escape?: boolean } = {}
): RenderResult {
  const missing: string[] = []
  // HTML bodies escape; the plain-text part does not.
  const escape = opts.escape !== false

  const render = (input: string, scope: TemplateVars): string => {
    let out = input

    // #each first, so tokens inside a block resolve against the item scope.
    out = out.replace(EACH, (_m, path: string, body: string) => {
      const list = lookup(scope, path)
      if (!Array.isArray(list)) {
        missing.push(path)
        return ''
      }
      return list
        .map((item) =>
          render(body, { ...scope, this: item, ...(isRecord(item) ? item : {}) })
        )
        .join('')
    })

    out = out.replace(IF, (_m, path: string, truthy: string, falsy?: string) =>
      isTruthy(lookup(scope, path)) ? render(truthy, scope) : render(falsy ?? '', scope)
    )

    out = out.replace(
      TOKEN,
      (_m, rawPath?: string, rawFilter?: string, path?: string, filter?: string) => {
        const isRaw = rawPath !== undefined
        const key = (isRaw ? rawPath : path) as string
        const filterName = isRaw ? rawFilter : filter

        const value = lookup(scope, key)
        if (value === undefined || value === null) {
          missing.push(key)
          return ''
        }

        const text = filterName ? (FILTERS[filterName]?.(value) ?? String(value)) : String(value)
        // {{{ }}} opts out of escaping for values already known to be safe HTML.
        return escape && !isRaw ? escapeHtml(text) : text
      }
    )

    return out
  }

  return { output: render(template, vars), missing: [...new Set(missing)] }
}

/** Renders subject + both bodies in one pass, reporting every missing token. */
export function renderNotification(
  template: { subject: string; bodyHtml: string; bodyText?: string | null },
  vars: TemplateVars
): { subject: string; html: string; text: string; missing: string[] } {
  const subject = renderTemplate(template.subject, vars, { escape: false })
  const html = renderTemplate(template.bodyHtml, vars, { escape: true })
  const text = template.bodyText
    ? renderTemplate(template.bodyText, vars, { escape: false })
    : { output: htmlToText(html.output), missing: [] as string[] }

  return {
    subject: subject.output,
    html: html.output,
    text: text.output,
    missing: [...new Set([...subject.missing, ...html.missing, ...text.missing])]
  }
}

/** Minimal HTML-to-text for the plain-text part when no text body is authored. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    // Block-level closes become a blank line so paragraphs stay readable as text.
    .replace(/<\/(p|div|h[1-6]|table|blockquote)>/gi, '\n\n')
    // List rows and table rows are single-spaced; double-spacing a list is noise.
    .replace(/<\/(li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
}

/**
 * Lists the placeholder paths a template refers to.
 *
 * Used to keep a template's documented variables in step with its actual body,
 * so the editor's token palette cannot drift from what the template really uses.
 * Control blocks (`#if`, `#each`, `/if`, `/each`) and the `this` scope variable
 * are not data paths and are excluded.
 */
export function extractTokens(template: string): string[] {
  const found = new Set<string>()
  const pattern = /\{\{\{?\s*#?\/?\s*([\w.]+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(template)) !== null) {
    const token = match[1]
    if (!token) continue
    if (['if', 'each', 'this'].includes(token)) continue
    found.add(token)
  }

  return [...found].sort()
}
