/**
 * CSV generation for report exports.
 *
 * Nothing in this codebase exported tabular data before, so this is new. Three
 * things matter beyond joining cells with commas:
 *
 *  - RFC 4180 quoting, so a cover-letter excerpt containing a comma, a quote or
 *    a newline does not shift every subsequent column.
 *  - A UTF-8 BOM, without which Excel on Windows decodes the file as the system
 *    codepage and mangles every diacritic in a Zimbabwean name.
 *  - Formula-injection defence. A cell beginning `=`, `+`, `-` or `@` is executed
 *    as a formula when the file is opened, so a candidate could put
 *    `=HYPERLINK(...)` in a free-text field and have it run on an HR machine.
 */

export interface CsvColumn<T> {
  /** Header text written to the first row. */
  header: string
  /** Extracts the cell value for a row. */
  value: (row: T) => unknown
}

const NEEDS_QUOTING = /[",\r\n]/
/** Leading characters spreadsheet apps treat as the start of a formula. */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

function stringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map(stringify).join('; ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Quote and neutralise a single cell. */
export function csvCell(value: unknown): string {
  let s = stringify(value)

  // Neutralise before quoting: a leading apostrophe makes spreadsheet apps treat
  // the cell as literal text. Applied only to strings that actually trigger it.
  if (s !== '' && FORMULA_TRIGGER.test(s)) s = `'${s}`

  if (NEEDS_QUOTING.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv<T>(
  rows: T[],
  columns: Array<CsvColumn<T>>,
  opts: { bom?: boolean; eol?: string } = {}
): string {
  const eol = opts.eol ?? '\r\n' // RFC 4180 specifies CRLF
  const lines: string[] = [columns.map((c) => csvCell(c.header)).join(',')]

  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row))).join(','))
  }

  const body = lines.join(eol) + eol
  return opts.bom === false ? body : '﻿' + body
}

/** Sets the response headers for a CSV download. Filename is sanitised. */
export function csvFilename(base: string): string {
  const safe = base.replace(/[^a-zA-Z0-9-_]+/g, '_').replace(/^_+|_+$/g, '') || 'export'
  return `${safe}.csv`
}
