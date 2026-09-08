/**
 * How complete a candidate's reusable profile is, 0–100.
 *
 * Shared so the profile page, the `/me` probe and the profile endpoint all
 * report the same number. A completion figure that disagrees with itself across
 * two screens is worse than not showing one.
 *
 * The weights are not arbitrary: they track how much retyping each section
 * saves. Qualifications and employment are the long repeaters — the ones a
 * candidate would otherwise re-enter for every post — so they carry the most.
 */

export interface ProfileLike {
  dateOfBirth?: unknown
  nationalId?: string | null
  gender?: string | null
  province?: string | null
  city?: string | null
  currentAddress?: string | null
  qualifications?: unknown
  employment?: unknown
  skills?: unknown
  languages?: unknown
}

export interface ProfileSection {
  key: string
  label: string
  weight: number
  complete: boolean
  /** What the candidate still has to do, when it is not complete. */
  hint: string
}

const arr = (v: unknown): any[] => (Array.isArray(v) ? v : [])

/** A language row counts only once a proficiency is actually set. */
const hasProficiency = (l: any) =>
  [l?.read, l?.write, l?.speak].some((p) => p && p !== 'NONE')

export function profileSections(profile: ProfileLike | null | undefined): ProfileSection[] {
  const p = profile ?? {}
  const qualifications = arr(p.qualifications)
  const employment = arr(p.employment)
  const skills = arr(p.skills)
  const languages = arr(p.languages)

  return [
    {
      key: 'identity',
      label: 'Identity',
      weight: 25,
      complete: Boolean(p.dateOfBirth && p.nationalId && p.gender),
      hint: 'Date of birth, national ID or passport number, and gender.'
    },
    {
      key: 'contact',
      label: 'Contact and address',
      weight: 15,
      complete: Boolean(p.province && p.city && p.currentAddress),
      hint: 'Province, city and your current address.'
    },
    {
      key: 'qualifications',
      label: 'Qualifications',
      weight: 20,
      complete: qualifications.length > 0,
      hint: 'At least one qualification, with the institution and the year.'
    },
    {
      key: 'employment',
      label: 'Employment history',
      weight: 20,
      complete: employment.length > 0,
      hint: 'At least one post, with your responsibilities.'
    },
    {
      key: 'skills',
      label: 'Skills',
      weight: 10,
      // Three is the point at which a keyword match starts to mean something.
      complete: skills.length >= 3,
      hint: 'Three or more skills. These are what vacancy keywords are matched against.'
    },
    {
      key: 'languages',
      label: 'Languages',
      weight: 10,
      complete: languages.some(hasProficiency),
      hint: 'Set your proficiency for at least one language.'
    }
  ]
}

export function profileCompletion(profile: ProfileLike | null | undefined): number {
  return profileSections(profile).reduce((sum, s) => sum + (s.complete ? s.weight : 0), 0)
}

/** The sections still worth prompting about, most valuable first. */
export function profileGaps(profile: ProfileLike | null | undefined): ProfileSection[] {
  return profileSections(profile)
    .filter((s) => !s.complete)
    .sort((a, b) => b.weight - a.weight)
}
