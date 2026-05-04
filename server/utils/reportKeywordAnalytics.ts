import { htmlToPlainText } from './htmlToPlainText'

export type KeywordCount = { word: string; count: number }

/** Common English / form filler words to exclude from analytics. */
const STOP_WORDS = new Set(
  `
  a about above after again against all am an and any are as at be because been before being below between both but by
  could did do does doing down during each few for from further had has have having he her here hers herself him himself his how
  i if in into is it its itself just like me more most much my myself no nor not now of off on once only or other our ours ourselves out over own
  same she should so some such than that the their them themselves then there these they this those through to too under until up very was we well were what when where which while who whom why will with would you your yours yourself yourselves
  also into onto per via viz vs etc eg ie may might must shall can could would should
  please thank thanks reported reporting case contact details
  anonymous name email phone number date time location province district place area city town village
  said says stating stated note notes additional involved persons person people
  very really just still even ever never always often sometimes often
  one two first second new old other another such same both few little much many more most less least lot lots some any all every each either neither
  will would shall should may might must can could
  href http https www com org zw png jpg pdf file upload
  ul ol li div span class style src alt width height px em strong b i u p br nbsp
  quill ql editor mention
`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
)

const MIN_LEN = 3
const DEFAULT_TOP = 45

/**
 * Tokenise plain text (Unicode letters), drop stop words, return top keywords by frequency.
 * Counts are occurrences across the combined corpus (not deduped per report).
 */
export function aggregateKeywordCounts(texts: (string | null | undefined)[], top = DEFAULT_TOP): KeywordCount[] {
  const counts = new Map<string, number>()

  for (const raw of texts) {
    if (!raw?.trim()) continue
    const plain = htmlToPlainText(raw)
    const lower = plain.toLowerCase()
    const tokens = lower.match(/[\p{L}]{3,}/gu)
    if (!tokens) continue
    for (let t of tokens) {
      t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      if (t.length < MIN_LEN) continue
      if (STOP_WORDS.has(t)) continue
      if (/^\d+$/.test(t)) continue
      counts.set(t, (counts.get(t) || 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, top)
}
