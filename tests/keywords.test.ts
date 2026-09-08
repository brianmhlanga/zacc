import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchKeywords, tokenize, foldAccents, buildKeywordSources } from '../shared/recruitment/keywords'
import type { TextSource } from '../shared/recruitment/keywords'

const src = (text: string): TextSource[] => [{ source: 'skills', text }]

test('tokenises and folds accents', () => {
  assert.deepEqual(tokenize('Advanced Excel, SAP;  IDEA'), ['advanced', 'excel', 'sap', 'idea'])
  assert.equal(foldAccents('Té Ndlovú'), 'te ndlovu')
  assert.deepEqual(tokenize(''), [])
})

test('matches on token boundaries, never inside a longer word', () => {
  // The whole reason this is token-based rather than substring-based.
  const r = matchKeywords({ required: ['SQL'], preferred: [], sources: src('consequential decisions') })
  assert.equal(r.requiredMatched, 0)
  assert.deepEqual(r.missed.map((m) => m.keyword), ['SQL'])

  const r2 = matchKeywords({ required: ['audit'], preferred: [], sources: src('the auditorium was full') })
  assert.equal(r2.requiredMatched, 0)

  const r3 = matchKeywords({ required: ['audit'], preferred: [], sources: src('led the audit team') })
  assert.equal(r3.requiredMatched, 1)
})

test('matches multi-word phrases as units', () => {
  const hit = matchKeywords({
    required: ['asset tracing'],
    preferred: [],
    sources: src('Responsible for asset tracing and recovery')
  })
  assert.equal(hit.requiredMatched, 1)

  // The two words present but not adjacent must not count.
  const miss = matchKeywords({
    required: ['asset tracing'],
    preferred: [],
    sources: src('asset registers and tracing of funds')
  })
  assert.equal(miss.requiredMatched, 0)
})

test('is case and punctuation insensitive', () => {
  const r = matchKeywords({
    required: ['Case Management'],
    preferred: [],
    sources: src('CASE-MANAGEMENT system administration')
  })
  assert.equal(r.requiredMatched, 1)
})

test('resolves synonyms and records which one matched', () => {
  const r = matchKeywords({
    required: ['forensic'],
    preferred: [],
    synonyms: { forensic: ['forensics', 'forensic accounting'] },
    sources: src('Ten years of forensic accounting experience')
  })
  assert.equal(r.requiredMatched, 1)
  assert.equal(r.matched[0]?.matchedVia, 'forensic accounting')
})

test('leaves matchedVia undefined when the keyword itself matched', () => {
  const r = matchKeywords({
    required: ['forensic'],
    preferred: [],
    synonyms: { forensic: ['forensics'] },
    sources: src('forensic examination')
  })
  assert.equal(r.matched[0]?.matchedVia, undefined)
})

test('counts occurrences and reports the source', () => {
  const r = matchKeywords({
    required: ['fraud'],
    preferred: [],
    sources: [
      { source: 'employment', text: 'fraud investigation, fraud reporting, fraud risk' }
    ]
  })
  assert.equal(r.matched[0]?.occurrences, 3)
  assert.equal(r.matched[0]?.source, 'employment')
})

test('weights required above preferred', () => {
  // All required, no preferred -> 70 by default weighting.
  const onlyRequired = matchKeywords({
    required: ['audit'],
    preferred: ['excel'],
    sources: src('audit work')
  })
  assert.equal(onlyRequired.percent, 70)

  const onlyPreferred = matchKeywords({
    required: ['audit'],
    preferred: ['excel'],
    sources: src('excel modelling')
  })
  assert.equal(onlyPreferred.percent, 30)

  const both = matchKeywords({
    required: ['audit'],
    preferred: ['excel'],
    sources: src('audit work in excel')
  })
  assert.equal(both.percent, 100)
})

test('an empty list lets the other carry the full percentage', () => {
  // Otherwise a vacancy with no preferred keywords could never exceed 70%.
  const r = matchKeywords({ required: ['audit'], preferred: [], sources: src('audit') })
  assert.equal(r.percent, 100)

  const p = matchKeywords({ required: [], preferred: ['excel'], sources: src('excel') })
  assert.equal(p.percent, 100)
})

test('handles an empty keyword set without dividing by zero', () => {
  const r = matchKeywords({ required: [], preferred: [], sources: src('anything') })
  assert.equal(r.percent, 0)
  assert.deepEqual(r.matched, [])
})

test('de-duplicates repeated keywords so they cannot inflate the score', () => {
  const r = matchKeywords({
    required: ['audit', 'Audit', 'AUDIT'],
    preferred: [],
    sources: src('audit')
  })
  assert.equal(r.requiredTotal, 1)
  assert.equal(r.percent, 100)
})

test('builds the corpus from every relevant part of the application', () => {
  const sources = buildKeywordSources({
    skills: { raw: 'SAP, IDEA', list: ['ACL'] },
    employment: { positions: [{ jobTitle: 'Auditor', responsibilities: 'reconciliation' }] },
    qualifications: [{ fieldOfStudy: 'Accounting', institution: 'UZ' }],
    coverLetter: 'passionate about integrity'
  })
  assert.deepEqual(sources.map((s) => s.source), ['skills', 'employment', 'qualifications', 'coverLetter'])

  // Empty sections are omitted rather than contributing blank text.
  const sparse = buildKeywordSources({ skills: { raw: '   ' }, employment: { positions: [] } })
  assert.deepEqual(sparse, [])
})
