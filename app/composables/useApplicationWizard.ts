/**
 * Wizard state: step registry, navigation, per-step validity and draft autosave.
 *
 * Kept out of the page so the shell stays readable. The prototype's eight steps
 * are declared here once and drive the stepper, the review page's jump links and
 * the "can I continue" checks.
 */
import { requiresExplanation } from '#shared/recruitment/declarations'

export interface WizardStep {
  n: number
  key: string
  label: string
}

export const WIZARD_STEPS: WizardStep[] = [
  { n: 1, key: 'personal', label: 'Personal details' },
  { n: 2, key: 'position', label: 'Position' },
  { n: 3, key: 'qualifications', label: 'Qualifications' },
  { n: 4, key: 'employment', label: 'Employment history' },
  { n: 5, key: 'integrity', label: 'Integrity' },
  { n: 6, key: 'skills', label: 'Skills' },
  { n: 7, key: 'attachments', label: 'Attachments' },
  { n: 8, key: 'review', label: 'Review & submit' }
]

export interface WizardAnswers {
  personal: Record<string, any>
  position: Record<string, any>
  qualifications: any[]
  memberships: any[]
  employment: { totalYears: number | null; isCurrentlyEmployed: boolean | null; positions: any[] }
  declarations: Record<string, { answer: boolean | null; explanation?: string | null; documentId?: string | null }>
  skills: { raw: string; list: string[] }
  languages: any[]
  documents: any[]
}

export function emptyAnswers(): WizardAnswers {
  return {
    personal: { nationality: 'Zimbabwean', nationalIdType: 'National ID' },
    position: {},
    qualifications: [],
    memberships: [],
    employment: { totalYears: null, isCurrentlyEmployed: null, positions: [] },
    declarations: {},
    skills: { raw: '', list: [] },
    languages: [
      { language: 'English', read: 'NONE', write: 'NONE', speak: 'NONE' },
      { language: 'Shona', read: 'NONE', write: 'NONE', speak: 'NONE' },
      { language: 'Ndebele', read: 'NONE', write: 'NONE', speak: 'NONE' }
    ],
    documents: []
  }
}

export function useApplicationWizard(
  answers: Ref<WizardAnswers>,
  documentSlots: Ref<any[]>
) {
  const currentStep = ref(1)
  const visited = ref(new Set<number>([1]))

  /**
   * Per-step problems. Returns a list rather than a boolean so the UI can say
   * what is wrong instead of just refusing to advance.
   */
  const problemsFor = (step: number): string[] => {
    const a = answers.value
    const out: string[] = []

    if (step === 1) {
      if (!a.personal.firstName?.trim()) out.push('First name')
      if (!a.personal.surname?.trim()) out.push('Surname')
      if (!a.personal.dateOfBirth) out.push('Date of birth')
      if (!a.personal.nationalId?.trim()) out.push('National ID or passport number')
      if (!a.personal.gender) out.push('Gender')
      if (!a.personal.phone?.trim()) out.push('Primary contact number')
      if (!a.personal.province) out.push('Province')
      if (!a.personal.currentAddress?.trim()) out.push('Current address')
      if (a.personal.hasDisability === true && !a.personal.disabilityDetail?.trim()) {
        out.push('Details of the accommodation needed')
      }
    }

    if (step === 2) {
      if (!a.position.howHeard) out.push('How you heard about the vacancy')
      if (a.position.howHeard === 'Other' && !a.position.howHeardOther?.trim()) {
        out.push('Please specify how you heard')
      }
      if (a.position.noticePeriodDays === null || a.position.noticePeriodDays === undefined) {
        out.push('Notice period')
      }
    }

    if (step === 3) {
      if (!a.qualifications.length) out.push('At least one qualification')
      for (const q of a.qualifications) {
        if (!q.isSchoolLevel && !q.institution?.trim()) {
          out.push(`Institution for ${q.levelLabel ?? q.level}`)
        }
      }
    }

    if (step === 4) {
      if (a.employment.totalYears === null || a.employment.totalYears === undefined) {
        out.push('Total years of relevant experience')
      }
      a.employment.positions.forEach((p: any, i: number) => {
        if (!p.employer?.trim()) out.push(`Employer for position ${i + 1}`)
        if (!p.jobTitle?.trim()) out.push(`Job title for position ${i + 1}`)
        if (!p.responsibilities?.trim()) out.push(`Responsibilities for position ${i + 1}`)
      })
    }

    if (step === 5) {
      for (const [key, d] of Object.entries(a.declarations)) {
        if (d.answer === null || d.answer === undefined) {
          out.push('An answer to every declaration')
          break
        }
      }
      for (const [key, d] of Object.entries(a.declarations)) {
        if (d.answer !== null && requiresExplanation(key, d.answer!) && !d.explanation?.trim()) {
          out.push('An explanation where you answered yes')
          break
        }
      }
      if (!a.personal.truthDeclaration) out.push('The truth declaration')
    }

    if (step === 7) {
      for (const slot of documentSlots.value) {
        if (slot.isMandatory && !a.documents.some((d: any) => d.slotKey === slot.key)) {
          out.push(slot.label)
        }
      }
    }

    return out
  }

  const stepIsValid = (step: number) => problemsFor(step).length === 0

  /** Steps that block submission, for the review page. */
  const blockingSteps = computed(() =>
    WIZARD_STEPS.filter((s) => s.n < 8 && !stepIsValid(s.n))
  )

  const canSubmit = computed(() => blockingSteps.value.length === 0)

  const goTo = (n: number) => {
    currentStep.value = Math.min(Math.max(1, n), WIZARD_STEPS.length)
    visited.value.add(currentStep.value)
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const next = () => goTo(currentStep.value + 1)
  const previous = () => goTo(currentStep.value - 1)

  /**
   * Step status for the stepper: only flag a step as having problems once the
   * candidate has actually been there, or every step is red on arrival.
   */
  const statusFor = (n: number): 'current' | 'complete' | 'problem' | 'upcoming' => {
    if (n === currentStep.value) return 'current'
    if (!visited.value.has(n)) return 'upcoming'
    return stepIsValid(n) ? 'complete' : 'problem'
  }

  return {
    steps: WIZARD_STEPS,
    currentStep,
    visited,
    problemsFor,
    stepIsValid,
    blockingSteps,
    canSubmit,
    goTo,
    next,
    previous,
    statusFor
  }
}
