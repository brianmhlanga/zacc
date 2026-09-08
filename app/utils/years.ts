/**
 * Year options for qualification and employment dates.
 *
 * A free number input for a year invites 201, 20144 and 1014 — all of which
 * pass a min/max check often enough to reach the database, and none of which a
 * candidate notices they typed. A fixed list removes the class of error rather
 * than validating after the fact.
 *
 * Descending, because someone entering a qualification is far more likely to
 * have finished recently than in 1975, and the useful end of the list should
 * not be a scroll away.
 */
export function yearOptions(opts: { back?: number; ahead?: number; now?: Date } = {}): number[] {
  const current = (opts.now ?? new Date()).getFullYear()
  // One year ahead: qualifications are routinely entered while the final year is
  // still in progress, and refusing that would push people into leaving it blank.
  const ahead = opts.ahead ?? 1
  const back = opts.back ?? 60

  const years: number[] = []
  for (let y = current + ahead; y >= current - back; y--) years.push(y)
  return years
}
