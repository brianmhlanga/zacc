/**
 * Working-hours send window for candidate notifications.
 *
 * The point of the configurable delay is that a rejection should not land in a
 * candidate's inbox seconds after they hit submit — that reads as a machine
 * deciding, not a panel. Delivering at 02:00 on a Sunday reads exactly the same
 * way, so a delayed message is also snapped into working hours.
 *
 * Times are computed against a fixed UTC offset rather than server-local time.
 * Zimbabwe is UTC+2 year-round with no daylight saving, so a fixed offset is both
 * correct and deterministic — and it means these calculations do not silently
 * change behaviour if the app is ever deployed to a box set to UTC.
 */

export interface SendWindow {
  /** Days the window is open. 0 = Sunday … 6 = Saturday. */
  days: number[]
  /** Inclusive local hour the window opens. */
  startHour: number
  /** Exclusive local hour the window closes. */
  endHour: number
  /** Minutes ahead of UTC. Africa/Harare is +120. */
  offsetMinutes: number
}

/** Monday–Friday, 08:00–17:00 CAT. */
export const DEFAULT_SEND_WINDOW: SendWindow = {
  days: [1, 2, 3, 4, 5],
  startHour: 8,
  endHour: 17,
  offsetMinutes: 120
}

/** Shifts an instant so UTC getters read as local wall-clock time. */
function toWall(instant: Date, offsetMinutes: number): Date {
  return new Date(instant.getTime() + offsetMinutes * 60_000)
}

function fromWall(wall: Date, offsetMinutes: number): Date {
  return new Date(wall.getTime() - offsetMinutes * 60_000)
}

export function isWithinSendWindow(instant: Date, window: SendWindow = DEFAULT_SEND_WINDOW): boolean {
  const wall = toWall(instant, window.offsetMinutes)
  if (!window.days.includes(wall.getUTCDay())) return false
  const hour = wall.getUTCHours()
  return hour >= window.startHour && hour < window.endHour
}

/**
 * The first instant at or after `from` that falls inside the window.
 * Returns `from` unchanged when it is already inside.
 */
export function nextAllowedSendTime(
  from: Date,
  window: SendWindow = DEFAULT_SEND_WINDOW
): Date {
  if (!window.days.length) return from // misconfigured: never hold a message hostage
  if (isWithinSendWindow(from, window)) return from

  let wall = toWall(from, window.offsetMinutes)

  // At most 14 hops covers any window configuration, including a single open day.
  for (let i = 0; i < 14; i++) {
    const isOpenDay = window.days.includes(wall.getUTCDay())

    if (isOpenDay && wall.getUTCHours() < window.startHour) {
      // Same day, before opening — wait for the window to open.
      const opening = new Date(
        Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate(), window.startHour, 0, 0, 0)
      )
      return fromWall(opening, window.offsetMinutes)
    }

    // Either a closed day, or past closing — move to the start of the next day.
    wall = new Date(
      Date.UTC(
        wall.getUTCFullYear(),
        wall.getUTCMonth(),
        wall.getUTCDate() + 1,
        window.startHour,
        0,
        0,
        0
      )
    )

    if (window.days.includes(wall.getUTCDay())) {
      return fromWall(wall, window.offsetMinutes)
    }
  }

  return from
}

/**
 * When a notification should actually be sent.
 *
 * Jitter exists so a batch of rejections issued in one bulk action does not all
 * arrive on the same second, which would give the automation away just as plainly
 * as sending them instantly.
 */
export function computeScheduledFor(opts: {
  now: Date
  delayMinutes: number
  jitterMinutes?: number
  respectSendWindow?: boolean
  window?: SendWindow
  /** Injectable for deterministic tests; defaults to Math.random. */
  random?: () => number
}): Date {
  const jitter = opts.jitterMinutes && opts.jitterMinutes > 0
    ? Math.floor((opts.random ?? Math.random)() * opts.jitterMinutes)
    : 0

  const due = new Date(opts.now.getTime() + (opts.delayMinutes + jitter) * 60_000)

  if (opts.respectSendWindow === false) return due
  return nextAllowedSendTime(due, opts.window ?? DEFAULT_SEND_WINDOW)
}
