import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DECLARATIONS,
  isAdverseDeclaration,
  requiresExplanation,
  declarationQuestion
} from '../shared/recruitment/declarations'

test('declaring corruption or a criminal record is adverse', () => {
  assert.equal(isAdverseDeclaration('corruption', true), true)
  assert.equal(isAdverseDeclaration('corruption', false), false)
  assert.equal(isAdverseDeclaration('criminal', true), true)
  assert.equal(isAdverseDeclaration('criminal', false), false)
})

test('refusing vetting is adverse — the adverse answer is "no"', () => {
  // The subtle one: for this question it is the negative answer that counts
  // against the applicant.
  assert.equal(isAdverseDeclaration('vetting', false), true)
  assert.equal(isAdverseDeclaration('vetting', true), false)
})

test('declaring a relative at ZACC is never adverse', () => {
  // A conflict of interest to record, not a mark against the candidate. Marking
  // it adverse would let honest disclosure drag down a score.
  assert.equal(isAdverseDeclaration('relatives', true), false)
  assert.equal(isAdverseDeclaration('relatives', false), false)
})

test('an unknown declaration key is never adverse', () => {
  assert.equal(isAdverseDeclaration('not_a_question', true), false)
})

test('explanations are required only where they make sense', () => {
  assert.equal(requiresExplanation('corruption', true), true)
  assert.equal(requiresExplanation('corruption', false), false)
  assert.equal(requiresExplanation('relatives', true), true)
  // Consenting to vetting needs no explanation either way.
  assert.equal(requiresExplanation('vetting', true), false)
  assert.equal(requiresExplanation('vetting', false), false)
})

test('every declaration has a question and a unique key', () => {
  const keys = DECLARATIONS.map((d) => d.key)
  assert.equal(new Set(keys).size, keys.length)
  for (const d of DECLARATIONS) {
    assert.ok(d.question.length > 10, `${d.key} needs a real question`)
    assert.equal(declarationQuestion(d.key), d.question)
  }
})
