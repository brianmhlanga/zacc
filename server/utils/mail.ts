import { mailConfig } from '../config/mail'

/**
 * Optional email: set RESEND_API_KEY + RESEND_FROM_EMAIL, or SMTP_* variables.
 * REPORTS_INBOX_EMAIL receives new corruption report notifications.
 */

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: opts.to,
          subject: opts.subject,
          html: opts.html ?? opts.text.replace(/\n/g, '<br>')
        })
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('[mail] Resend error', res.status, err)
        return false
      }
      return true
    } catch (e) {
      console.error('[mail] Resend request failed', e)
      return false
    }
  }

  const host = process.env.SMTP_HOST || mailConfig.host
  if (!host) {
    console.warn('[mail] No RESEND_API_KEY or SMTP_HOST configured; skipping send')
    return false
  }

  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || mailConfig.port || 587),
      secure: process.env.SMTP_SECURE === 'true' || mailConfig.secure === true,
      auth:
        process.env.SMTP_USER != null && process.env.SMTP_USER !== ''
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
          : mailConfig.auth
    })

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || mailConfig.from || 'noreply@localhost'
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html
    })
    return true
  } catch (e) {
    console.error('[mail] SMTP send failed', e)
    return false
  }
}

export async function notifyReportsInbox(params: {
  reportNumber: string
  adminReportsUrl: string
}): Promise<void> {
  const to = process.env.REPORTS_INBOX_EMAIL || 'reports@zacc.co.zw'
  if (!to) return

  const html = `
    <div style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#111827;color:#ffffff;padding:18px 22px;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.8;">ZACC Case Notification</div>
          <h2 style="margin:8px 0 0;font-size:20px;line-height:1.2;">New Corruption Report Submitted</h2>
        </div>
        <div style="padding:20px 22px;">
          <p style="margin:0 0 14px;font-size:14px;line-height:1.5;">
            A new corruption report has just been submitted through the public reporting portal.
          </p>
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 16px;">
            <tr>
              <td style="padding:10px;border:1px solid #e5e7eb;background:#f9fafb;font-size:12px;font-weight:700;text-transform:uppercase;color:#374151;">Case Number</td>
              <td style="padding:10px;border:1px solid #e5e7eb;font-size:14px;font-family:Consolas,Monaco,monospace;color:#111827;">
                ${params.reportNumber}
              </td>
            </tr>
          </table>
          <a href="${params.adminReportsUrl}"
             style="display:inline-block;background:#209341;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:700;">
            Open Reports in Admin
          </a>
          <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">
            This is an automated notification from the ZACC platform.
          </p>
        </div>
      </div>
    </div>
  `

  await sendMail({
    to,
    subject: `[ZACC] New corruption report ${params.reportNumber}`,
    text: `A new corruption report was submitted.\n\nReport number: ${params.reportNumber}\n\nAdmin: ${params.adminReportsUrl}\n`,
    html
  })
}

export async function notifyContactInbox(params: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  await sendMail({
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html
  })
}
