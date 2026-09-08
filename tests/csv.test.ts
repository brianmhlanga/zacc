import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCsv, csvCell, csvFilename } from '../server/utils/csv'

test('quotes cells containing a comma, quote or newline', () => {
  assert.equal(csvCell('plain'), 'plain')
  assert.equal(csvCell('a,b'), '"a,b"')
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(csvCell('line1\r\nline2'), '"line1\r\nline2"')
})

test('neutralises formula injection triggers', () => {
  // A candidate typing this into a free-text field must not execute on an HR machine.
  assert.equal(csvCell('=HYPERLINK("http://evil","click")'), '"\'=HYPERLINK(""http://evil"",""click"")"')
  assert.equal(csvCell('+1234'), "'+1234")
  assert.equal(csvCell('-1234'), "'-1234")
  assert.equal(csvCell('@SUM(A1)'), "'@SUM(A1)")
  // A legitimate negative number is still altered — accepted trade, documented.
  assert.equal(csvCell('safe-value'), 'safe-value')
})

test('formats common value shapes', () => {
  assert.equal(csvCell(null), '')
  assert.equal(csvCell(undefined), '')
  assert.equal(csvCell(true), 'Yes')
  assert.equal(csvCell(false), 'No')
  assert.equal(csvCell(['a', 'b']), 'a; b')
  assert.equal(csvCell(new Date('2026-08-19T00:00:00.000Z')), '2026-08-19T00:00:00.000Z')
})

test('emits a UTF-8 BOM by default so Excel renders diacritics', () => {
  const out = toCsv([{ name: 'Chiedza Nyandoro' }], [{ header: 'Name', value: (r) => r.name }])
  assert.equal(out.charCodeAt(0), 0xfeff)
  assert.ok(out.includes('Chiedza Nyandoro'))
  assert.equal(toCsv([], [{ header: 'Name', value: () => '' }], { bom: false }).charCodeAt(0), 'N'.charCodeAt(0))
})

test('writes header then one CRLF-terminated row per record', () => {
  const out = toCsv(
    [
      { ref: 'ZACC-APP-2026-00318', score: 87 },
      { ref: 'ZACC-APP-2026-00331', score: 52 }
    ],
    [
      { header: 'Reference', value: (r) => r.ref },
      { header: 'Score', value: (r) => r.score }
    ],
    { bom: false }
  )
  assert.equal(
    out,
    'Reference,Score\r\nZACC-APP-2026-00318,87\r\nZACC-APP-2026-00331,52\r\n'
  )
})

test('sanitises export filenames', () => {
  assert.equal(csvFilename('Applicant Register 2026/08'), 'Applicant_Register_2026_08.csv')
  assert.equal(csvFilename('***'), 'export.csv')
})
