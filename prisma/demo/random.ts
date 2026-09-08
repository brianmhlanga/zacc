/**
 * Deterministic pseudo-randomness for the demo seed.
 *
 * Seeded on purpose. QA needs to be able to say "applicant ZACC-APP-2026-…
 * scores 78 and is auto-rejected on the criminal-record rule" and have that
 * still be true after a reset, on someone else's machine. `Math.random()` would
 * make every bug report unreproducible.
 */

/** Mulberry32 — small, fast, and good enough for fixture data. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number

  constructor(seed = 20260902) {
    this.next = mulberry32(seed)
  }

  /** Float in [0, 1). */
  float(): number {
    return this.next()
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  /** True with the given probability. */
  chance(p: number): boolean {
    return this.next() < p
  }

  pick<T>(items: readonly T[]): T {
    if (!items.length) throw new Error('pick() called on an empty list')
    return items[Math.floor(this.next() * items.length)]!
  }

  /** `count` distinct items, or the whole list if it is shorter. */
  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items]
    const out: T[] = []
    const n = Math.min(count, pool.length)
    for (let i = 0; i < n; i++) out.push(...pool.splice(Math.floor(this.next() * pool.length), 1))
    return out
  }

  /**
   * Picks by relative weight. Used for stage distribution, where a realistic
   * pipeline is a funnel — most applications sit in screening, a handful reach
   * offer — and a uniform spread would make the console look nothing like one.
   */
  weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
    const total = entries.reduce((s, [, w]) => s + w, 0)
    let roll = this.next() * total
    for (const [value, weight] of entries) {
      roll -= weight
      if (roll <= 0) return value
    }
    return entries[entries.length - 1]![0]
  }

  /**
   * Roughly normal, clamped. Scores and years of experience cluster; a flat
   * distribution would put as many 25-year veterans in the pile as mid-career
   * applicants and make every average meaningless.
   */
  normal(mean: number, stdev: number, min: number, max: number): number {
    const u = Math.max(this.next(), 1e-9)
    const v = this.next()
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    return Math.min(max, Math.max(min, mean + z * stdev))
  }

  /** A date between two bounds, to the minute. */
  dateBetween(from: Date, to: Date): Date {
    const t = from.getTime() + this.next() * (to.getTime() - from.getTime())
    return new Date(Math.round(t / 60000) * 60000)
  }
}

export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000)
export const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000)
