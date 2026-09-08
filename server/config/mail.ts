/**
 * SMTP fallback configuration, read from the environment only.
 *
 * There are deliberately NO hardcoded credentials here. This file previously
 * carried a live Mailtrap sandbox host and login, which meant `mailConfig.host`
 * was always truthy and the "no transport configured" guard in
 * `server/utils/mail.ts` could never fire. A deployment with no SMTP_* / RESEND_*
 * variables therefore looked healthy while silently delivering every message —
 * corruption-report notifications included — into a third-party sandbox.
 *
 * Configure a transport with either:
 *   RESEND_API_KEY (+ RESEND_FROM_EMAIL)   — preferred, used first
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * With neither set, `sendMail` returns `{ ok: false, skipped: true }` and logs a
 * warning rather than pretending to have sent.
 */
export const mailConfig = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  from: process.env.SMTP_FROM || process.env.SMTP_USER || ''
}
