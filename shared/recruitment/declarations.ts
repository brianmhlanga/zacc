/**
 * The integrity declarations and what counts as an adverse answer.
 *
 * "Adverse" is not simply "answered yes". It depends on the question: declaring
 * a criminal record is adverse, and so is *refusing* vetting. Declaring a
 * relative at the Commission is a conflict of interest to record, not an adverse
 * finding, and must not on its own contribute to a rejection.
 *
 * Shared so the wizard can warn a candidate before they submit, using exactly the
 * rule the server applies afterwards.
 */

export interface DeclarationDef {
  key: string
  question: string
  /** The answer that constitutes an adverse declaration, or null if neither is. */
  adverseAnswer: boolean | null
  /** Whether an explanation becomes mandatory, and on which answer. */
  explanationRequiredOn: boolean | null
  helpText?: string
}

export const DECLARATIONS: readonly DeclarationDef[] = [
  {
    key: 'corruption',
    question:
      'Are you currently, or have you ever been, under investigation for corruption, fraud or any related offence?',
    adverseAnswer: true,
    explanationRequiredOn: true,
    helpText: 'Give the case reference, the investigating authority and the outcome.'
  },
  {
    key: 'criminal',
    question: 'Do you have any criminal record or pending prosecution?',
    adverseAnswer: true,
    explanationRequiredOn: true,
    helpText: 'Give details of the conviction or charge. Certified court documents may be attached.'
  },
  {
    key: 'relatives',
    question: 'Do you have any relatives currently employed by ZACC?',
    // Disclosing a relative is a conflict to record, never a mark against the
    // candidate. Failing to disclose one would be the problem.
    adverseAnswer: null,
    explanationRequiredOn: true,
    helpText: 'List full names, relationship and department.'
  },
  {
    key: 'vetting',
    question: 'Are you willing to undergo a full background check and declaration of assets?',
    // Refusing is what is adverse here, so the adverse answer is `false`.
    adverseAnswer: false,
    explanationRequiredOn: null,
    helpText: 'Vetting is a condition of employment at the Commission.'
  }
] as const

const BY_KEY = new Map(DECLARATIONS.map((d) => [d.key, d]))

export function getDeclaration(key: string): DeclarationDef | undefined {
  return BY_KEY.get(key)
}

export function declarationQuestion(key: string): string {
  return BY_KEY.get(key)?.question ?? key
}

/** Whether this answer to this question is an adverse declaration. */
export function isAdverseDeclaration(key: string, answer: boolean): boolean {
  const def = BY_KEY.get(key)
  if (!def || def.adverseAnswer === null) return false
  return answer === def.adverseAnswer
}

/** Whether an explanation is mandatory for this answer. */
export function requiresExplanation(key: string, answer: boolean): boolean {
  const def = BY_KEY.get(key)
  if (!def || def.explanationRequiredOn === null) return false
  return answer === def.explanationRequiredOn
}
