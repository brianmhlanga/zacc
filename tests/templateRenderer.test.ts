import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderTemplate, renderNotification, escapeHtml , extractTokens} from '../server/utils/templateRenderer'

test('substitutes simple and dotted tokens', () => {
  const r = renderTemplate('Dear {{firstName}} {{ lastName }},', { firstName: 'Tariro', lastName: 'Chikafu' })
  assert.equal(r.output, 'Dear Tariro Chikafu,')
  assert.deepEqual(r.missing, [])

  const nested = renderTemplate('Ref {{application.reference}}', {
    application: { reference: 'ZACC-APP-2026-00318' }
  })
  assert.equal(nested.output, 'Ref ZACC-APP-2026-00318')
})

test('escapes HTML in values by default', () => {
  // Values include candidate-supplied text, so this must not be injectable.
  const r = renderTemplate('<p>{{name}}</p>', { name: '<script>alert(1)</script>' })
  assert.equal(r.output, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  assert.ok(!r.output.includes('<script>'))
})

test('{{{ }}} opts out of escaping for pre-sanitised HTML', () => {
  const r = renderTemplate('{{{body}}}', { body: '<strong>Shortlisted</strong>' })
  assert.equal(r.output, '<strong>Shortlisted</strong>')
})

test('escape:false leaves the plain-text part untouched', () => {
  const r = renderTemplate('{{name}}', { name: 'Ndlovu & Co' }, { escape: false })
  assert.equal(r.output, 'Ndlovu & Co')
})

test('collects missing tokens and renders them empty', () => {
  // A template typo must not mail the candidate the literal "{{firstNmae}}".
  const r = renderTemplate('Dear {{firstNmae}},', { firstName: 'Tariro' })
  assert.equal(r.output, 'Dear ,')
  assert.deepEqual(r.missing, ['firstNmae'])
})

test('de-duplicates repeated missing tokens', () => {
  const r = renderTemplate('{{a}} {{a}} {{b}}', {})
  assert.deepEqual(r.missing, ['a', 'b'])
})

test('#if renders only when truthy, with else support', () => {
  const t = '{{#if shortlisted}}You are shortlisted{{else}}Not this time{{/if}}'
  assert.equal(renderTemplate(t, { shortlisted: true }).output, 'You are shortlisted')
  assert.equal(renderTemplate(t, { shortlisted: false }).output, 'Not this time')
  assert.equal(renderTemplate(t, {}).output, 'Not this time')
})

test('#if treats empty strings and empty arrays as falsy', () => {
  const t = '{{#if items}}has items{{/if}}'
  assert.equal(renderTemplate(t, { items: [] }).output, '')
  assert.equal(renderTemplate(t, { items: [1] }).output, 'has items')
  assert.equal(renderTemplate('{{#if s}}x{{/if}}', { s: '   ' }).output, '')
})

test('#each iterates and exposes item fields in scope', () => {
  const r = renderTemplate('{{#each documents}}- {{label}}\n{{/each}}', {
    documents: [{ label: 'CV' }, { label: 'Certificates' }]
  })
  assert.equal(r.output, '- CV\n- Certificates\n')
})

test('#each over a non-array records it as missing rather than throwing', () => {
  const r = renderTemplate('{{#each nope}}x{{/each}}', {})
  assert.equal(r.output, '')
  assert.deepEqual(r.missing, ['nope'])
})

test('#each can still see the outer scope', () => {
  const r = renderTemplate('{{#each items}}{{prefix}}{{name}} {{/each}}', {
    prefix: '* ',
    items: [{ name: 'a' }, { name: 'b' }]
  })
  assert.equal(r.output, '* a * b ')
})

test('values inside #each are still escaped', () => {
  const r = renderTemplate('{{#each items}}{{name}}{{/each}}', { items: [{ name: '<b>x</b>' }] })
  assert.equal(r.output, '&lt;b&gt;x&lt;/b&gt;')
})

test('filters format dates, case, numbers and money', () => {
  const iso = '2026-09-02T09:30:00.000Z'
  assert.equal(renderTemplate('{{d | date}}', { d: iso }).output, '02 September 2026')
  assert.equal(renderTemplate('{{d | day}}', { d: iso }).output, 'Wednesday, 02 September 2026')
  assert.equal(renderTemplate('{{n | upper}}', { n: 'shortlisted' }).output, 'SHORTLISTED')
  assert.equal(renderTemplate('{{n | title}}', { n: 'senior INVESTIGATIONS officer' }).output, 'Senior Investigations Officer')
  assert.equal(renderTemplate('{{n | number}}', { n: 41234 }).output, '41,234')
  assert.equal(renderTemplate('{{n | money}}', { n: 1500 }).output, 'USD 1,500.00')
})

test('an invalid date renders empty rather than "Invalid Date"', () => {
  assert.equal(renderTemplate('{{d | date}}', { d: 'not-a-date' }).output, '')
})

test('an unknown filter falls back to the raw value', () => {
  assert.equal(renderTemplate('{{n | bogus}}', { n: 'x' }).output, 'x')
})

test('escapeHtml covers all five entities', () => {
  assert.equal(escapeHtml(`<&>"'`), '&lt;&amp;&gt;&quot;&#39;')
})

test('renderNotification derives a plain-text part when none is authored', () => {
  const r = renderNotification(
    {
      subject: 'Your application {{reference}}',
      bodyHtml: '<p>Dear {{firstName}},</p><p>You have been <strong>shortlisted</strong>.</p>'
    },
    { reference: 'ZACC-APP-2026-00318', firstName: 'Tariro' }
  )
  assert.equal(r.subject, 'Your application ZACC-APP-2026-00318')
  assert.ok(r.html.includes('<strong>shortlisted</strong>'))
  assert.equal(r.text, 'Dear Tariro,\n\nYou have been shortlisted.')
  assert.deepEqual(r.missing, [])
})

test('renderNotification reports missing tokens from every part', () => {
  const r = renderNotification(
    { subject: '{{a}}', bodyHtml: '{{b}}', bodyText: '{{c}}' },
    {}
  )
  assert.deepEqual(r.missing.sort(), ['a', 'b', 'c'])
})

test('subject lines are not HTML-escaped', () => {
  // An email subject is not HTML; escaping would show "Ndlovu &amp; Co".
  const r = renderNotification({ subject: '{{name}}', bodyHtml: '' }, { name: 'Ndlovu & Co' })
  assert.equal(r.subject, 'Ndlovu & Co')
})

test('extractTokens lists data paths and ignores control blocks', () => {
  const tokens = extractTokens(
    'Hi {{firstName}}, your ref is {{reference}}. {{#if interview.venue}}At {{interview.venue}}{{/if}} {{{rawHtml}}}'
  )
  assert.deepEqual(tokens, ['firstName', 'interview.venue', 'rawHtml', 'reference'])
  // #if / #each / this are structure, not data — they must not appear.
  assert.equal(tokens.includes('if'), false)
  assert.equal(tokens.includes('this'), false)
})

test('extractTokens de-duplicates repeated placeholders', () => {
  assert.deepEqual(extractTokens('{{a}} {{a}} {{b}}'), ['a', 'b'])
})

test('extractTokens handles a template with no placeholders', () => {
  assert.deepEqual(extractTokens('Plain text, nothing dynamic.'), [])
})
