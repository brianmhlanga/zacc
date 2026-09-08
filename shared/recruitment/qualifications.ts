/**
 * The academic qualification ladder.
 *
 * Lives in `shared/` because the scoring engine runs in two places: the
 * candidate's live scorecard in the browser and the authoritative score on the
 * server. Two copies of this table would eventually disagree, and the failure
 * would be silent — a candidate shown 74 who is filed at 68.
 */

export type QualificationLevel =
  | 'DOCTORATE'
  | 'MASTERS'
  | 'POSTGRAD_DIPLOMA'
  | 'FIRST_DEGREE'
  | 'HIGHER_DIPLOMA'
  | 'DIPLOMA'
  | 'CERTIFICATE'
  | 'A_LEVEL'
  | 'O_LEVEL'
  | 'GRADE_7'

export interface QualificationLevelDef {
  level: QualificationLevel
  label: string
  /** Default ladder points, 0–100. A vacancy may override these per criterion. */
  points: number
  /** School-level qualifications capture school/year/result instead of field/institution. */
  isSchoolLevel: boolean
  /** Higher rank == more advanced. Used for ordering and "highest attained". */
  rank: number
}

export const QUALIFICATION_LEVELS: readonly QualificationLevelDef[] = [
  { level: 'DOCTORATE',        label: 'Doctorate / PhD',       points: 100, isSchoolLevel: false, rank: 10 },
  { level: 'MASTERS',          label: "Master's Degree",       points: 90,  isSchoolLevel: false, rank: 9 },
  { level: 'POSTGRAD_DIPLOMA', label: 'Post Graduate Diploma', points: 78,  isSchoolLevel: false, rank: 8 },
  { level: 'FIRST_DEGREE',     label: 'First Degree',          points: 72,  isSchoolLevel: false, rank: 7 },
  { level: 'HIGHER_DIPLOMA',   label: 'Higher Diploma / HND',  points: 60,  isSchoolLevel: false, rank: 6 },
  { level: 'DIPLOMA',          label: 'Diploma',               points: 50,  isSchoolLevel: false, rank: 5 },
  { level: 'CERTIFICATE',      label: 'Certificate',           points: 35,  isSchoolLevel: false, rank: 4 },
  { level: 'A_LEVEL',          label: 'A Level',               points: 25,  isSchoolLevel: true,  rank: 3 },
  { level: 'O_LEVEL',          label: 'O Level',               points: 15,  isSchoolLevel: true,  rank: 2 },
  { level: 'GRADE_7',          label: 'Grade 7',               points: 8,   isSchoolLevel: true,  rank: 1 }
] as const

const BY_LEVEL = new Map(QUALIFICATION_LEVELS.map((q) => [q.level, q]))

export function getQualificationLevel(level: QualificationLevel): QualificationLevelDef | undefined {
  return BY_LEVEL.get(level)
}

export function qualificationLabel(level: QualificationLevel): string {
  return BY_LEVEL.get(level)?.label ?? String(level)
}

export function qualificationPoints(level: QualificationLevel): number {
  return BY_LEVEL.get(level)?.points ?? 0
}

/**
 * Highest level from a set of attained levels, by rank.
 *
 * Rank, not points: a vacancy can override points per criterion, and "highest
 * attained" must stay stable regardless of how a particular vacancy scores it.
 */
export function highestQualification(
  levels: readonly QualificationLevel[]
): QualificationLevel | null {
  let best: QualificationLevelDef | null = null
  for (const level of levels) {
    const def = BY_LEVEL.get(level)
    if (!def) continue
    if (!best || def.rank > best.rank) best = def
  }
  return best ? best.level : null
}

/** Levels ordered most advanced first — the order the ladder renders in. */
export function orderedLevels(): readonly QualificationLevelDef[] {
  return QUALIFICATION_LEVELS
}

/** True when `level` meets or exceeds `required`. Used by disqualifier rules. */
export function meetsQualification(
  level: QualificationLevel | null | undefined,
  required: QualificationLevel
): boolean {
  if (!level) return false
  const have = BY_LEVEL.get(level)
  const need = BY_LEVEL.get(required)
  if (!have || !need) return false
  return have.rank >= need.rank
}
