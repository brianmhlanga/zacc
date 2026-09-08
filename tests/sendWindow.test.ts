import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  nextAllowedSendTime,
  isWithinSendWindow,
  computeScheduledFor,
  DEFAULT_SEND_WINDOW
} from '../server/utils/sendWindow'
import type { SendWindow } from '../server/utils/sendWindow'

/** Builds an instant from CAT (UTC+2) wall-clock components. */
const cat = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(Date.UTC(y, m - 1, d, h - 2, min, 0, 0))

/** Renders an instant back to CAT wall clock for readable assertions. */
const asCat = (d: Date) => {
  const w = new Date(d.getTime() + 120 * 60_000)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const p = (n: number) => String(n).padStart(2, '0')
  return `${days[w.getUTCDay()]} ${w.getUTCFullYear()}-${p(w.getUTCMonth() + 1)}-${p(w.getUTCDate())} ${p(w.getUTCHours())}:${p(w.getUTCMinutes())}`
}

// 2026-08-27 is a Thursday; 2026-08-28 a Friday; 2026-08-31 a Monday.

test('recognises times inside and outside the window', () => {
  assert.equal(isWithinSendWindow(cat(2026, 8, 27, 9, 0)), true, 'Thu 09:00')
  assert.equal(isWithinSendWindow(cat(2026, 8, 27, 8, 0)), true, 'opens at 08:00 inclusive')
  assert.equal(isWithinSendWindow(cat(2026, 8, 27, 16, 59)), true, 'still open at 16:59')
  assert.equal(isWithinSendWindow(cat(2026, 8, 27, 17, 0)), false, 'closes at 17:00 exclusive')
  assert.equal(isWithinSendWindow(cat(2026, 8, 27, 7, 59)), false, 'before opening')
  assert.equal(isWithinSendWindow(cat(2026, 8, 29, 10, 0)), false, 'Saturday')
  assert.equal(isWithinSendWindow(cat(2026, 8, 30, 10, 0)), false, 'Sunday')
})

test('leaves a time already inside the window untouched', () => {
  const inside = cat(2026, 8, 27, 10, 30)
  assert.equal(nextAllowedSendTime(inside).getTime(), inside.getTime())
})

test('an early-morning time waits for the window to open the same day', () => {
  assert.equal(asCat(nextAllowedSendTime(cat(2026, 8, 27, 6, 15))), 'Thu 2026-08-27 08:00')
})

test('an evening time rolls to the next morning', () => {
  assert.equal(asCat(nextAllowedSendTime(cat(2026, 8, 27, 19, 40))), 'Fri 2026-08-28 08:00')
})

test('Friday 16:55 plus a 2h delay lands Monday 08:00', () => {
  // The scenario from the plan: a rejection queued just before close on a Friday
  // must not arrive over the weekend.
  const due = new Date(cat(2026, 8, 28, 16, 55).getTime() + 2 * 60 * 60_000)
  assert.equal(asCat(due), 'Fri 2026-08-28 18:55', 'sanity: the raw due time is after close')
  assert.equal(asCat(nextAllowedSendTime(due)), 'Mon 2026-08-31 08:00')
})

test('weekend times roll forward to Monday', () => {
  assert.equal(asCat(nextAllowedSendTime(cat(2026, 8, 29, 11, 0))), 'Mon 2026-08-31 08:00')
  assert.equal(asCat(nextAllowedSendTime(cat(2026, 8, 30, 23, 30))), 'Mon 2026-08-31 08:00')
})

test('handles a window with a single open day', () => {
  const mondayOnly: SendWindow = { days: [1], startHour: 9, endHour: 10, offsetMinutes: 120 }
  // Tuesday should wait almost a full week.
  assert.equal(asCat(nextAllowedSendTime(cat(2026, 8, 25, 12, 0), mondayOnly)), 'Mon 2026-08-31 09:00')
})

test('a window with no open days never holds a message', () => {
  const broken: SendWindow = { days: [], startHour: 8, endHour: 17, offsetMinutes: 120 }
  const t = cat(2026, 8, 29, 3, 0)
  assert.equal(nextAllowedSendTime(t, broken).getTime(), t.getTime())
})

test('respects a different UTC offset', () => {
  const utc: SendWindow = { ...DEFAULT_SEND_WINDOW, offsetMinutes: 0 }
  // 07:00 UTC is 09:00 CAT — inside the CAT window, but before an 08:00 UTC opening.
  const t = new Date(Date.UTC(2026, 7, 27, 7, 0))
  assert.equal(isWithinSendWindow(t, DEFAULT_SEND_WINDOW), true)
  assert.equal(isWithinSendWindow(t, utc), false)
  const early = new Date(Date.UTC(2026, 7, 27, 6, 0)) // 08:00 CAT, 06:00 UTC
  assert.equal(isWithinSendWindow(early, DEFAULT_SEND_WINDOW), true)
  assert.equal(isWithinSendWindow(early, utc), false)
})

test('computeScheduledFor applies the delay', () => {
  const now = cat(2026, 8, 27, 9, 0)
  const due = computeScheduledFor({ now, delayMinutes: 120, respectSendWindow: false })
  assert.equal(asCat(due), 'Thu 2026-08-27 11:00')
})

test('computeScheduledFor applies deterministic jitter', () => {
  const now = cat(2026, 8, 27, 9, 0)
  // random() = 0.5 with 60 minutes of jitter -> +30.
  const due = computeScheduledFor({
    now,
    delayMinutes: 0,
    jitterMinutes: 60,
    respectSendWindow: false,
    random: () => 0.5
  })
  assert.equal(asCat(due), 'Thu 2026-08-27 09:30')
})

test('computeScheduledFor snaps into the window by default', () => {
  const now = cat(2026, 8, 28, 16, 0) // Friday 16:00
  const due = computeScheduledFor({ now, delayMinutes: 180 }) // -> Fri 19:00
  assert.equal(asCat(due), 'Mon 2026-08-31 08:00')
})

test('zero delay with no jitter inside hours sends immediately', () => {
  const now = cat(2026, 8, 27, 10, 0)
  const due = computeScheduledFor({ now, delayMinutes: 0 })
  assert.equal(due.getTime(), now.getTime())
})
