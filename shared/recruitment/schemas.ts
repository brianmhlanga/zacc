/**
 * Validation for the vacancy scoring scheme.
 *
 * Lives in `shared/` so the builder UI and the API validate against the same
 * rules. A criterion the form accepts but the server rejects (or worse, the
 * reverse) is how a scheme ends up half-saved.
 */
import { z } from 'zod'

export const scoreBucketSchema = z.enum([
  'QUALIFICATIONS_EXPERIENCE',
  'SKILLS',
  'INTEGRITY',
  'FIT'
])

export const qualificationLevelSchema = z.enum([
  'DOCTORATE', 'MASTERS', 'POSTGRAD_DIPLOMA', 'FIRST_DEGREE', 'HIGHER_DIPLOMA',
  'DIPLOMA', 'CERTIFICATE', 'A_LEVEL', 'O_LEVEL', 'GRADE_7'
])

/** A scoring band, e.g. "5-10 years = 80 points". */
export const bandSchema = z.object({
  label: z.string().min(1, 'Each band needs a label'),
  min: z.number().nullable(),
  max: z.number().nullable(),
  points: z.number().min(0).max(1000)
})

export const criterionConfigSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('BANDED'),
    unit: z.string().optional(),
    interpolate: z.boolean().optional(),
    bands: z.array(bandSchema).min(1, 'Add at least one band')
  }),
  z.object({
    kind: z.literal('QUALIFICATION_LADDER'),
    ladder: z.array(z.object({ level: qualificationLevelSchema, points: z.number().min(0) })).min(1),
    creditAdditional: z.boolean().optional(),
    additionalPointsEach: z.number().optional(),
    cap: z.number().optional()
  }),
  z.object({
    kind: z.literal('KEYWORD'),
    required: z.array(z.string().min(1)).default([]),
    preferred: z.array(z.string().min(1)).default([]),
    synonyms: z.record(z.string(), z.array(z.string())).optional(),
    requiredWeight: z.number().optional(),
    preferredWeight: z.number().optional(),
    sources: z.array(z.enum(['skills', 'employment', 'qualifications', 'coverLetter'])).optional()
  }),
  z.object({
    kind: z.literal('BOOLEAN'),
    truePoints: z.number(),
    falsePoints: z.number()
  }),
  z.object({
    kind: z.literal('CHOICE'),
    map: z.record(z.string(), z.number()),
    defaultPoints: z.number().optional()
  }),
  z.object({
    kind: z.literal('MANUAL'),
    rubric: z.array(z.object({
      label: z.string().min(1),
      points: z.number().min(0),
      guidance: z.string().optional()
    })).min(1, 'A manual criterion needs a rubric for reviewers to score against')
  })
])

export const criterionSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers and underscores'),
  label: z.string().min(1, 'Give the criterion a label'),
  description: z.string().nullish(),
  bucket: scoreBucketSchema,
  type: z.enum(['BANDED', 'QUALIFICATION_LADDER', 'KEYWORD', 'BOOLEAN', 'CHOICE', 'MANUAL']),
  weight: z.number().min(0).max(100),
  maxPoints: z.number().min(1).max(1000),
  config: criterionConfigSchema,
  sourceField: z.string().nullish(),
  isAutoScored: z.boolean(),
  isPanelScored: z.boolean(),
  isRequired: z.boolean().optional(),
  showToCandidate: z.boolean(),
  sortOrder: z.number().int()
}).superRefine((c, ctx) => {
  // The type and the config discriminator must agree, or scoring silently
  // falls through to zero for every applicant.
  if (c.config.kind !== c.type) {
    ctx.addIssue({
      code: 'custom',
      path: ['config'],
      message: `Configuration is for a ${c.config.kind} criterion but the type is ${c.type}`
    })
  }
  if (c.type === 'MANUAL' && c.isAutoScored) {
    ctx.addIssue({ code: 'custom', path: ['isAutoScored'], message: 'A manual criterion cannot be auto-scored' })
  }
  if (c.type !== 'MANUAL' && !c.isAutoScored && !c.isPanelScored) {
    ctx.addIssue({ code: 'custom', path: ['isAutoScored'], message: 'A criterion must be auto-scored, panel-scored, or both' })
  }
  // Everything except KEYWORD and MANUAL reads a value out of the application.
  if (['BANDED', 'BOOLEAN', 'CHOICE'].includes(c.type) && !c.sourceField) {
    ctx.addIssue({ code: 'custom', path: ['sourceField'], message: `A ${c.type} criterion needs a source field` })
  }
})

export const disqualifierSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1, 'Give the rule a label'),
  type: z.enum([
    'MIN_NUMERIC', 'MAX_NUMERIC', 'REQUIRED_TRUE', 'REQUIRED_FALSE',
    'REQUIRED_QUALIFICATION', 'VALUE_IN', 'VALUE_NOT_IN', 'MISSING_DOCUMENT',
    'AGE_RANGE', 'CLOSING_DATE'
  ]),
  sourceField: z.string().nullish(),
  config: z.record(z.string(), z.unknown()).default({}),
  action: z.enum(['AUTO_REJECT', 'FLAG_ONLY']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  publicReason: z.string().nullish(),
  internalReason: z.string().nullish(),
  isActive: z.boolean(),
  sortOrder: z.number().int()
})

export const documentSlotSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1),
  description: z.string().nullish(),
  isMandatory: z.boolean(),
  allowMultiple: z.boolean(),
  maxFiles: z.number().int().min(1).max(20),
  allowedExtensions: z.array(z.string().min(1)).min(1, 'Allow at least one file type'),
  maxSizeBytes: z.number().int().min(1024),
  sortOrder: z.number().int()
})

export const panelMemberSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  role: z.enum(['CHAIR', 'MEMBER', 'OBSERVER', 'HR_COORDINATOR']),
  canSeeIdentity: z.boolean(),
  canSeeDemographics: z.boolean(),
  canSeeOtherScores: z.boolean()
})

export const bucketWeightsSchema = z.object({
  QUALIFICATIONS_EXPERIENCE: z.number().min(0).max(100),
  SKILLS: z.number().min(0).max(100),
  INTEGRITY: z.number().min(0).max(100),
  FIT: z.number().min(0).max(100)
}).refine((w) => {
  const total = w.QUALIFICATIONS_EXPERIENCE + w.SKILLS + w.INTEGRITY + w.FIT
  return Math.abs(total - 100) < 0.01
}, { message: 'Bucket weights must add up to 100' })

/** The whole screening configuration, as saved from the builder. */
export const vacancySchemeSchema = z.object({
  bucketWeights: bucketWeightsSchema.optional(),
  keywords: z.object({
    required: z.array(z.string()).default([]),
    preferred: z.array(z.string()).default([]),
    synonyms: z.record(z.string(), z.array(z.string())).optional()
  }).optional(),
  jobDescriptionText: z.string().nullish(),
  minYearsExperience: z.number().int().min(0).max(60).nullish(),
  maxNoticePeriodDays: z.number().int().min(0).max(365).nullish(),
  panelAggregation: z.enum(['MEAN', 'MEDIAN', 'TRIMMED_MEAN', 'CHAIR_OVERRIDE']).optional(),
  panelSpreadThreshold: z.number().min(0).max(100).optional(),
  panelBlindIdentity: z.boolean().optional(),
  panelBlindDemographics: z.boolean().optional(),
  autoRejectEnabled: z.boolean().optional(),
  autoRejectDelayMinutes: z.number().int().min(0).nullish(),
  criteria: z.array(criterionSchema).optional(),
  disqualifiers: z.array(disqualifierSchema).optional(),
  documentSlots: z.array(documentSlotSchema).optional(),
  panelMembers: z.array(panelMemberSchema).optional()
}).superRefine((s, ctx) => {
  const dupe = (list: Array<{ key: string }> | undefined, what: string, path: string) => {
    if (!list) return
    const seen = new Set<string>()
    list.forEach((item, i) => {
      if (seen.has(item.key)) {
        ctx.addIssue({ code: 'custom', path: [path, i, 'key'], message: `Duplicate ${what} key "${item.key}"` })
      }
      seen.add(item.key)
    })
  }
  dupe(s.criteria, 'criterion', 'criteria')
  dupe(s.disqualifiers, 'rule', 'disqualifiers')
  dupe(s.documentSlots, 'document', 'documentSlots')

  // A bucket carrying weight but holding no criteria silently discards that
  // share of the score — the total would never reach 100.
  if (s.bucketWeights && s.criteria?.length) {
    const used = new Set(s.criteria.map((c) => c.bucket))
    for (const [bucket, weight] of Object.entries(s.bucketWeights)) {
      if (weight > 0 && !used.has(bucket as any)) {
        ctx.addIssue({
          code: 'custom',
          path: ['bucketWeights', bucket],
          message: `"${bucket}" carries ${weight}% of the score but has no criteria`
        })
      }
    }
  }
})

export type VacancyScheme = z.infer<typeof vacancySchemeSchema>
export type CriterionInput = z.infer<typeof criterionSchema>
export type DisqualifierInput = z.infer<typeof disqualifierSchema>
export type DocumentSlotInput = z.infer<typeof documentSlotSchema>
