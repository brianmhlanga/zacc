/**
 * Decides what a given viewer is allowed to see of an application.
 *
 * This runs on the server and physically deletes keys from the payload. It is
 * deliberately not a set of `v-if`s in a Vue template: a field that reaches the
 * browser is not masked, whatever the UI chooses to render. A panel member with
 * `canSeeDemographics: false` must not be able to open devtools and read the
 * applicant's gender.
 *
 * The prototype ZACC supplied states that gender and disability are "masked from
 * shortlisting panels"; this is where that is enforced.
 */

export type ViewerContext =
  | { kind: 'admin' }
  | {
      kind: 'panel'
      userId: string
      canSeeIdentity: boolean
      canSeeDemographics: boolean
      canSeeOtherScores: boolean
    }
  | { kind: 'candidate'; candidateId: string }

/** Fields that identify the applicant as a person. */
const IDENTITY_FIELDS = [
  'name', 'firstName', 'lastName', 'email', 'phone', 'altPhone',
  'nationalId', 'nationalIdType', 'referenceNumber'
] as const

/** Fields carrying protected characteristics. */
const DEMOGRAPHIC_FIELDS = [
  'gender', 'dateOfBirth', 'hasDisability', 'nationality', 'province', 'city'
] as const

/** Internal assessment a candidate must never see. */
const INTERNAL_FIELDS = [
  'autoScore', 'finalScore', 'panelScoreMean', 'panelScoreMedian', 'panelScoreSpread',
  'panelScoreStdev', 'panelReviewCount', 'scoreOverride', 'scoreOverrideNote',
  'keywordMatchPct', 'notes', 'reviewedBy', 'schemeSnapshot', 'integrityFlagCount',
  'isShortlisted', 'autoRejectReasons'
] as const

function omit<T extends Record<string, any>>(obj: T, keys: readonly string[]): T {
  const copy: Record<string, any> = { ...obj }
  for (const k of keys) delete copy[k]
  return copy as T
}

/** Applies the masking rules for one viewer to one application record. */
export function projectApplication<T extends Record<string, any>>(
  application: T,
  viewer: ViewerContext
): Partial<T> & { masked?: string[] } {
  if (viewer.kind === 'admin') return application

  if (viewer.kind === 'candidate') {
    // A candidate sees their own submission and the PUBLIC stage label only.
    let out = omit(application, INTERNAL_FIELDS)
    if (out.stage) {
      out = {
        ...out,
        stage: {
          key: out.stage.key,
          publicLabel: out.stage.publicLabel,
          publicDescription: out.stage.publicDescription,
          colorHex: out.stage.colorHex
        }
      } as T
    }
    return out
  }

  // Panel member.
  const masked: string[] = []
  let out: Record<string, any> = { ...application }

  if (!viewer.canSeeIdentity) {
    out = omit(out, IDENTITY_FIELDS)
    masked.push('identity')
    // Give them something stable to refer to in discussion.
    out.displayLabel = `Candidate ${String(application.id).slice(-6).toUpperCase()}`
  }

  if (!viewer.canSeeDemographics) {
    out = omit(out, DEMOGRAPHIC_FIELDS)
    masked.push('demographics')
    if (out.answers?.personal) {
      // The raw wizard payload carries the same fields; masking the columns
      // while leaving `answers` intact would be no masking at all.
      out.answers = {
        ...out.answers,
        personal: omit(out.answers.personal, [
          'gender', 'dateOfBirth', 'hasDisability', 'disabilityDetail', 'nationality'
        ])
      }
    }
  }

  if (!viewer.canSeeOtherScores) {
    // Independence: a reviewer must not anchor on colleagues' numbers before
    // submitting their own.
    delete out.panelScores
    delete out.panelScoreMean
    delete out.panelScoreMedian
    delete out.panelScoreSpread
    delete out.panelScoreStdev
    delete out.reviews
    masked.push('otherScores')
  }

  return { ...out, masked } as Partial<T> & { masked?: string[] }
}

/** Resolves a user's panel permissions for a vacancy, or null if not on the panel. */
export async function resolvePanelViewer(
  prisma: any,
  jobId: string,
  userId: string,
  role: string
): Promise<ViewerContext | null> {
  // A super admin is not subject to panel masking — they administer the process
  // rather than scoring within it.
  if (role === 'SUPER_ADMIN') return { kind: 'admin' }

  const membership = await prisma.vacancyPanelMember.findUnique({
    where: { jobId_userId: { jobId, userId } },
    select: { canSeeIdentity: true, canSeeDemographics: true, canSeeOtherScores: true }
  })
  if (!membership) return null

  return {
    kind: 'panel',
    userId,
    canSeeIdentity: membership.canSeeIdentity,
    canSeeDemographics: membership.canSeeDemographics,
    canSeeOtherScores: membership.canSeeOtherScores
  }
}
