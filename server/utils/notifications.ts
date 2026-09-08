/**
 * Queues candidate notifications from back-office-editable templates.
 *
 * Nothing here sends. Everything becomes an `EmailOutbox` row and the poller in
 * `server/plugins/recruitmentOutbox.ts` drains it. That indirection is what makes
 * the configurable delay possible, and it also means a request never waits on an
 * SMTP handshake.
 */
import { prisma } from './prisma'
import { renderNotification } from './templateRenderer'
import { computeScheduledFor, DEFAULT_SEND_WINDOW, type SendWindow } from './sendWindow'

export interface EnqueueResult {
  queued: boolean
  id?: string
  scheduledFor?: Date
  /** Template placeholders that had no value. Logged, never mailed. */
  missingTokens?: string[]
  reason?: string
}

export interface EnqueueOptions {
  templateKey: string
  to: { email: string; name?: string | null }
  variables: Record<string, unknown>
  /** Lets a later stage change cancel this message. */
  contextType?: string
  contextId?: string
  delayMinutes?: number
  jitterMinutes?: number
  respectSendWindow?: boolean
  window?: SendWindow
  now?: Date
}

export async function enqueueNotification(opts: EnqueueOptions): Promise<EnqueueResult> {
  if (!opts.to?.email) {
    return { queued: false, reason: 'No recipient address' }
  }

  const template = await prisma.notificationTemplate.findUnique({
    where: { key: opts.templateKey }
  })

  if (!template) {
    // Not fatal: a stage may reference a template an admin later deleted. The
    // application still moves; the notice just does not go out.
    console.warn(`[notifications] no template for key "${opts.templateKey}"`)
    return { queued: false, reason: `Unknown template "${opts.templateKey}"` }
  }
  if (!template.isActive) {
    return { queued: false, reason: `Template "${opts.templateKey}" is inactive` }
  }

  const rendered = renderNotification(
    { subject: template.subject, bodyHtml: template.bodyHtml, bodyText: template.bodyText },
    opts.variables
  )

  if (rendered.missing.length) {
    // Worth surfacing: a typo'd placeholder silently produces a bare email.
    console.warn(
      `[notifications] template "${opts.templateKey}" has unresolved tokens: ${rendered.missing.join(', ')}`
    )
  }

  const scheduledFor = computeScheduledFor({
    now: opts.now ?? new Date(),
    delayMinutes: opts.delayMinutes ?? 0,
    jitterMinutes: opts.jitterMinutes ?? 0,
    respectSendWindow: opts.respectSendWindow ?? true,
    window: opts.window ?? DEFAULT_SEND_WINDOW
  })

  const row = await prisma.emailOutbox.create({
    data: {
      templateId: template.id,
      templateKey: template.key,
      toEmail: opts.to.email,
      toName: opts.to.name ?? null,
      subject: rendered.subject,
      bodyHtml: rendered.html,
      bodyText: rendered.text,
      status: 'SCHEDULED',
      scheduledFor,
      contextType: opts.contextType ?? null,
      contextId: opts.contextId ?? null,
      variables: opts.variables as any
    },
    select: { id: true }
  })

  return {
    queued: true,
    id: row.id,
    scheduledFor,
    missingTokens: rendered.missing
  }
}

/**
 * The standard placeholder bag available to every recruitment template.
 *
 * Deliberately exposes the stage's PUBLIC label, never the internal one — a
 * template author must not be able to leak "Security checks" to a candidate by
 * picking the wrong token.
 */
export function buildApplicationVariables(input: {
  application: {
    referenceNumber?: string | null
    firstName?: string | null
    lastName?: string | null
    email: string
    submittedAt?: Date | null
    finalScore?: number | null
  }
  job: { title: string; department?: string | null; closingDate?: Date | null; grade?: string | null }
  stage?: { publicLabel: string; publicDescription?: string | null } | null
  extra?: Record<string, unknown>
}): Record<string, unknown> {
  const { application, job, stage } = input
  const fullName = [application.firstName, application.lastName].filter(Boolean).join(' ')

  return {
    reference: application.referenceNumber ?? '',
    firstName: application.firstName ?? '',
    lastName: application.lastName ?? '',
    fullName,
    email: application.email,
    submittedAt: application.submittedAt ?? null,
    score: application.finalScore ?? null,
    vacancy: {
      title: job.title,
      department: job.department ?? '',
      grade: job.grade ?? '',
      closingDate: job.closingDate ?? null
    },
    // Public-facing only, by design.
    status: stage?.publicLabel ?? '',
    statusDescription: stage?.publicDescription ?? '',
    commission: {
      name: 'Zimbabwe Anti-Corruption Commission',
      shortName: 'ZACC',
      email: process.env.REPORTS_INBOX_EMAIL || 'recruitment@zacc.co.zw',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://zacc.co.zw'
    },
    ...(input.extra ?? {})
  }
}

/** Event keys the module emits. Seeded templates are keyed by these. */
export const NOTIFICATION_KEYS = {
  CANDIDATE_VERIFY_EMAIL: 'candidate.verify_email',
  CANDIDATE_PASSWORD_RESET: 'candidate.password_reset',
  APPLICATION_RECEIVED: 'application.received',
  APPLICATION_STAGE_CHANGED: 'application.stage_changed',
  APPLICATION_SHORTLISTED: 'application.shortlisted',
  APPLICATION_REJECTED: 'application.rejected',
  APPLICATION_AUTO_REJECTED: 'application.auto_rejected',
  APPLICATION_WITHDRAWN: 'application.withdrawn',
  INTERVIEW_INVITATION: 'interview.invitation',
  DOCUMENT_ACTION_NEEDED: 'document.action_needed',
  MESSAGE_FROM_COMMISSION: 'message.from_commission'
} as const

export type NotificationKey = (typeof NOTIFICATION_KEYS)[keyof typeof NOTIFICATION_KEYS]
