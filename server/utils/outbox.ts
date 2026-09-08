/**
 * The notification send queue.
 *
 * A delayed rejection cannot be a `setTimeout`. PM2 restarts, deploys and crashes
 * all vaporise in-memory timers, and a rejection notice that silently never
 * arrives is worse for a candidate than one that arrives instantly. So every
 * message is a row, and a poller drains it.
 */
import { prisma } from './prisma'
import { sendMail } from './mail'

const BATCH_SIZE = 25
/** A row claimed but not finished within this window is assumed to be orphaned. */
const STUCK_AFTER_MINUTES = 10

/** 1m, 2m, 4m, 8m, 16m … capped at 6h. */
export function backoffMs(attempt: number): number {
  return Math.min(60_000 * 2 ** Math.max(0, attempt - 1), 6 * 60 * 60_000)
}

export interface OutboxTickResult {
  reaped: number
  claimed: number
  sent: number
  failed: number
  skipped: number
}

/**
 * One drain cycle.
 *
 * The claim is a compare-and-swap, not a plain read-then-write. PM2 currently
 * runs `instances: '1'`, but `exec_mode: 'cluster'` makes raising that a
 * one-character edit — and with a naive claim that edit would silently double-send
 * every rejection. Guarding here is far cheaper than discovering it in production.
 */
export async function processOutboxTick(): Promise<OutboxTickResult> {
  const result: OutboxTickResult = { reaped: 0, claimed: 0, sent: 0, failed: 0, skipped: 0 }

  // 1. Release rows a dead worker claimed and never completed.
  const reaped = await prisma.emailOutbox.updateMany({
    where: {
      status: 'CLAIMED',
      claimedAt: { lt: new Date(Date.now() - STUCK_AFTER_MINUTES * 60_000) }
    },
    data: { status: 'SCHEDULED', claimToken: null, claimedAt: null }
  })
  result.reaped = reaped.count

  // 2. Shortlist due rows. Non-authoritative — another worker may take them.
  const shortlist = await prisma.emailOutbox.findMany({
    where: { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
    orderBy: { scheduledFor: 'asc' },
    take: BATCH_SIZE,
    select: { id: true }
  })
  if (!shortlist.length) return result

  // 3. Atomic claim. `status: 'SCHEDULED'` in the WHERE is the guard: MySQL
  //    row-locks each matched row, so only one worker's UPDATE can flip it.
  const claimToken = randomToken()
  const claim = await prisma.emailOutbox.updateMany({
    where: { id: { in: shortlist.map((r) => r.id) }, status: 'SCHEDULED' },
    data: { status: 'CLAIMED', claimToken, claimedAt: new Date() }
  })
  result.claimed = claim.count
  if (claim.count === 0) return result

  // 4. Only the rows this worker actually won.
  const claimed = await prisma.emailOutbox.findMany({ where: { claimToken } })

  for (const row of claimed) {
    const res = await sendMail({
      to: row.toEmail,
      subject: row.subject,
      text: row.bodyText,
      html: row.bodyHtml
    })

    if (res.ok) {
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: { status: 'SENT', sentAt: new Date(), claimToken: null, claimedAt: null, lastError: null }
      })
      result.sent++
      continue
    }

    // No transport configured at all: retrying every 30s forever just fills the
    // log. Park the row so it shows up on the outbox monitor and can be requeued
    // once mail is configured.
    if (res.skipped) {
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: {
          status: 'SKIPPED',
          claimToken: null,
          claimedAt: null,
          lastError: res.error ?? 'No mail transport configured'
        }
      })
      result.skipped++
      continue
    }

    const attempts = row.attempts + 1
    const exhausted = attempts >= row.maxAttempts
    await prisma.emailOutbox.update({
      where: { id: row.id },
      data: {
        status: exhausted ? 'FAILED' : 'SCHEDULED',
        attempts,
        claimToken: null,
        claimedAt: null,
        scheduledFor: exhausted ? row.scheduledFor : new Date(Date.now() + backoffMs(attempts)),
        lastError: (res.error ?? 'send failed').slice(0, 2000)
      }
    })
    if (exhausted) result.failed++
  }

  return result
}

/**
 * Deletes expired candidate sessions and single-use tokens.
 *
 * Runs on the outbox tick because it needs a heartbeat and there is no other one.
 * The supplier portal never got a sweeper and its `supplier_sessions` table grows
 * without bound; candidates do not inherit that.
 */
export async function sweepExpiredCandidateAuth(): Promise<{ sessions: number; tokens: number }> {
  const now = new Date()
  const sessions = await prisma.candidateSession.deleteMany({ where: { expiresAt: { lt: now } } })
  const tokens = await prisma.candidateToken.deleteMany({ where: { expiresAt: { lt: now } } })
  return { sessions: sessions.count, tokens: tokens.count }
}

/** Cancels pending notifications for a context — e.g. a rejection whose stage changed. */
export async function cancelPendingNotifications(
  contextType: string,
  contextId: string,
  opts: { templateKey?: string } = {}
): Promise<number> {
  const res = await prisma.emailOutbox.updateMany({
    where: {
      contextType,
      contextId,
      status: { in: ['SCHEDULED', 'SKIPPED'] },
      ...(opts.templateKey ? { templateKey: opts.templateKey } : {})
    },
    data: { status: 'CANCELLED' }
  })
  return res.count
}

function randomToken(): string {
  // crypto.randomUUID exists on Node 18+; this file only ever runs server-side.
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
