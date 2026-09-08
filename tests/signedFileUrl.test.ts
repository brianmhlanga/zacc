import { test, before } from 'node:test'
import assert from 'node:assert/strict'

before(() => {
  process.env.NUXT_FILE_SIGNING_SECRET = 'test-secret-at-least-32-characters-long!!'
})

const { signFileUrl, verifyFileSignature, normalizeSignedPath } = await import(
  '../server/utils/signedFileUrl'
)

function parse(url: string) {
  const [path, query] = url.split('?')
  const params = new URLSearchParams(query)
  return { path: path!, exp: params.get('exp'), sig: params.get('sig') }
}

test('normalises paths with or without the /api/uploads prefix', () => {
  assert.equal(normalizeSignedPath('/api/uploads/recruitment/abc/cv.pdf'), 'recruitment/abc/cv.pdf')
  assert.equal(normalizeSignedPath('recruitment/abc/cv.pdf'), 'recruitment/abc/cv.pdf')
  assert.equal(normalizeSignedPath('/recruitment/abc/cv.pdf'), 'recruitment/abc/cv.pdf')
  assert.equal(normalizeSignedPath('recruitment/abc/cv.pdf?exp=1&sig=2'), 'recruitment/abc/cv.pdf')
})

test('a freshly signed URL verifies', () => {
  const { path, exp, sig } = parse(signFileUrl('recruitment/cand1/cv.pdf'))
  assert.ok(path.startsWith('/api/uploads/'))
  assert.equal(verifyFileSignature(path, exp, sig), true)
})

test('rejects a tampered path', () => {
  const { exp, sig } = parse(signFileUrl('recruitment/cand1/cv.pdf'))
  // Same signature, different file — the classic attempt to read someone else's CV.
  assert.equal(verifyFileSignature('/api/uploads/recruitment/cand2/cv.pdf', exp, sig), false)
})

test('rejects a tampered expiry', () => {
  const { path, exp, sig } = parse(signFileUrl('recruitment/cand1/cv.pdf'))
  const extended = String(Number(exp) + 86_400)
  assert.equal(verifyFileSignature(path, extended, sig), false)
})

test('rejects an expired signature', () => {
  const url = signFileUrl('recruitment/cand1/cv.pdf', -10) // already elapsed
  const { path, exp, sig } = parse(url)
  assert.equal(verifyFileSignature(path, exp, sig), false)
})

test('rejects missing or malformed parameters', () => {
  const { path, exp, sig } = parse(signFileUrl('recruitment/cand1/cv.pdf'))
  assert.equal(verifyFileSignature(path, null, sig), false)
  assert.equal(verifyFileSignature(path, exp, null), false)
  assert.equal(verifyFileSignature(path, 'not-a-number', sig), false)
  // A short signature must not throw from timingSafeEqual's length check.
  assert.equal(verifyFileSignature(path, exp, 'abc'), false)
})
