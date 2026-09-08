/**
 * Drains the notification outbox on an interval.
 *
 * This is the first Nitro plugin in the repo. It is written to fail safe: the
 * whole body is guarded, and any failure degrades to "notifications queue but do
 * not send" rather than "the site does not start". Set
 * RECRUITMENT_OUTBOX_DISABLED=1 to stop a given instance from sending — useful
 * during a maintenance window, or on any additional PM2 instance.
 *
 * Chosen over `nitro.experimental.tasks` deliberately: that flag changes a shared
 * build setting for the whole application, its API has churned across Nitro
 * versions, and scheduled tasks fire on every worker so they would need the same
 * compare-and-swap claim anyway. A plain plugin buys the same behaviour without
 * betting the module's reliability on an experimental flag.
 */
import { processOutboxTick, sweepExpiredCandidateAuth } from '../utils/outbox'
import { isMailConfigured } from '../utils/mail'

const DEFAULT_INTERVAL_MS = 30_000
/** Sweep expired sessions roughly hourly, not on every tick. */
const SWEEP_EVERY_TICKS = 120

export default defineNitroPlugin((nitro) => {
  if (process.env.RECRUITMENT_OUTBOX_DISABLED === '1') {
    console.info('[outbox] disabled by RECRUITMENT_OUTBOX_DISABLED')
    return
  }

  if (!isMailConfigured()) {
    // Loud, once, at boot — the failure mode this guards against is a deployment
    // that looks healthy while every candidate notification silently goes nowhere.
    console.error(
      '[outbox] No mail transport configured (set RESEND_API_KEY or SMTP_HOST). ' +
        'Notifications will queue and be parked as SKIPPED until one is set.'
    )
  }

  const intervalMs = Math.max(5_000, Number(process.env.OUTBOX_POLL_MS) || DEFAULT_INTERVAL_MS)
  let running = false
  let ticks = 0

  const timer = setInterval(async () => {
    // Never overlap ticks within a worker; a slow SMTP server must not stack up.
    if (running) return
    running = true
    try {
      const result = await processOutboxTick()
      if (result.sent || result.failed || result.skipped) {
        console.info(
          `[outbox] sent=${result.sent} failed=${result.failed} skipped=${result.skipped} reaped=${result.reaped}`
        )
      }

      if (++ticks % SWEEP_EVERY_TICKS === 0) {
        const swept = await sweepExpiredCandidateAuth()
        if (swept.sessions || swept.tokens) {
          console.info(`[outbox] swept ${swept.sessions} sessions, ${swept.tokens} tokens`)
        }
      }
    } catch (error) {
      console.error('[outbox] tick failed', error)
    } finally {
      running = false
    }
  }, intervalMs)

  // Do not hold the process open during shutdown.
  timer.unref?.()
  nitro.hooks.hook('close', () => clearInterval(timer))

  console.info(`[outbox] poller started, interval ${intervalMs}ms`)
})
