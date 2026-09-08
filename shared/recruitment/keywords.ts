/**
 * Keyword matching for the SKILLS bucket.
 *
 * Deliberately token-based rather than substring-based. `"SQL"` must not match
 * inside `"consequential"`, and `"audit"` must not match inside `"auditorium"`,
 * or every candidate scores highly on keywords they never mentioned and the whole
 * bucket becomes noise.
 *
 * `server/utils/reportKeywordAnalytics.ts` already tokenises text for the reports
 * analytics page, but it aggregates *frequencies of unknown words*. Here the
 * vocabulary is known up front (the vacancy's keyword set) and multi-word phrases
 * like "asset tracing" and "case management" must match as units, so the two do
 * different jobs.
 */
import type { KeywordMatch, KeywordSource } from './types'

/** Folds accents and lowercases, so "Té" and "te" compare equal. */
export function foldAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Splits text into comparable word tokens. */
export function tokenize(text: string): string[] {
  return foldAccents(text)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export interface TextSource {
  source: KeywordSource
  text: string
}

interface PreparedSource {
  source: KeywordSource
  tokens: string[]
  /** Tokens joined with single spaces, padded, for O(1) phrase containment. */
  joined: string
}

function prepare(sources: TextSource[]): PreparedSource[] {
  return sources
    .filter((s) => s.text && s.text.trim())
    .map((s) => {
      const tokens = tokenize(s.text)
      return { source: s.source, tokens, joined: ` ${tokens.join(' ')} ` }
    })
}

/** Counts non-overlapping occurrences of a prepared phrase in a prepared source. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    count++
    // Step forward by one space so adjacent repeats are both counted.
    index = haystack.indexOf(needle, index + needle.length - 1)
  }
  return count
}

/**
 * Looks for one keyword (and its synonyms) across all sources.
 * Returns the first source that matched, and the total occurrence count.
 */
function findKeyword(
  keyword: string,
  synonyms: string[],
  prepared: PreparedSource[]
): { occurrences: number; matchedVia?: string; source?: KeywordSource } {
  const candidates = [keyword, ...synonyms]
  let total = 0
  let matchedVia: string | undefined
  let source: KeywordSource | undefined

  for (const candidate of candidates) {
    const phrase = tokenize(candidate).join(' ')
    if (!phrase) continue
    // Pad both sides so the match is on whole-token boundaries.
    const needle = ` ${phrase} `

    for (const p of prepared) {
      const hits = countOccurrences(p.joined, needle)
      if (hits > 0) {
        total += hits
        if (!matchedVia) {
          matchedVia = candidate === keyword ? undefined : candidate
          source = p.source
        }
      }
    }
  }

  return { occurrences: total, matchedVia, source }
}

export interface KeywordMatchResult {
  matched: KeywordMatch[]
  missed: Array<{ keyword: string; isRequired: boolean }>
  /** 0–100, weighted toward required keywords. */
  percent: number
  requiredMatched: number
  requiredTotal: number
  preferredMatched: number
  preferredTotal: number
}

export function matchKeywords(opts: {
  required: string[]
  preferred: string[]
  synonyms?: Record<string, string[]>
  sources: TextSource[]
  /** Share of the percentage carried by required keywords. Default 0.7. */
  requiredWeight?: number
}): KeywordMatchResult {
  const prepared = prepare(opts.sources)
  const synonyms = opts.synonyms ?? {}
  const matched: KeywordMatch[] = []
  const missed: Array<{ keyword: string; isRequired: boolean }> = []

  const run = (list: string[], isRequired: boolean) => {
    let hits = 0
    // De-duplicate case-insensitively so a repeated keyword cannot inflate the score.
    const seen = new Set<string>()
    for (const keyword of list) {
      const norm = foldAccents(keyword).trim()
      if (!norm || seen.has(norm)) continue
      seen.add(norm)

      const found = findKeyword(keyword, synonyms[keyword] ?? [], prepared)
      if (found.occurrences > 0) {
        hits++
        matched.push({
          keyword,
          isRequired,
          occurrences: found.occurrences,
          matchedVia: found.matchedVia,
          source: found.source
        })
      } else {
        missed.push({ keyword, isRequired })
      }
    }
    return { hits, total: seen.size }
  }

  const req = run(opts.required ?? [], true)
  const pref = run(opts.preferred ?? [], false)

  const requiredWeight = opts.requiredWeight ?? 0.7
  const preferredWeight = 1 - requiredWeight

  // When one list is empty the other carries the whole percentage, rather than
  // capping the achievable score at 70%.
  let percent: number
  if (req.total === 0 && pref.total === 0) {
    percent = 0
  } else if (pref.total === 0) {
    percent = (req.hits / req.total) * 100
  } else if (req.total === 0) {
    percent = (pref.hits / pref.total) * 100
  } else {
    percent =
      (req.hits / req.total) * requiredWeight * 100 +
      (pref.hits / pref.total) * preferredWeight * 100
  }

  return {
    matched,
    missed,
    percent: Math.round(percent * 10) / 10,
    requiredMatched: req.hits,
    requiredTotal: req.total,
    preferredMatched: pref.hits,
    preferredTotal: pref.total
  }
}

/** Builds the text corpus a keyword criterion searches. */
export function buildKeywordSources(app: {
  skills?: { raw?: string; list?: string[] }
  employment?: { positions?: Array<{ jobTitle?: string; responsibilities?: string | null }> }
  qualifications?: Array<{ fieldOfStudy?: string | null; institution?: string | null }>
  coverLetter?: string | null
}): TextSource[] {
  const sources: TextSource[] = []

  const skills = [app.skills?.raw ?? '', ...(app.skills?.list ?? [])].join(' ')
  if (skills.trim()) sources.push({ source: 'skills', text: skills })

  const employment = (app.employment?.positions ?? [])
    .map((p) => `${p.jobTitle ?? ''} ${p.responsibilities ?? ''}`)
    .join(' ')
  if (employment.trim()) sources.push({ source: 'employment', text: employment })

  const quals = (app.qualifications ?? [])
    .map((q) => `${q.fieldOfStudy ?? ''} ${q.institution ?? ''}`)
    .join(' ')
  if (quals.trim()) sources.push({ source: 'qualifications', text: quals })

  if (app.coverLetter?.trim()) sources.push({ source: 'coverLetter', text: app.coverLetter })

  return sources
}
