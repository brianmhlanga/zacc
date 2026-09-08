/**
 * Seeds the recruitment pipeline stages and notification templates.
 *
 * Kept separate from `seed.ts` (2300+ lines of homepage content) so it can be run
 * on its own, and so re-running it is safe: everything upserts by its natural key.
 *
 * Run with:  npm run prisma:seed:recruitment
 */
import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { parseDatabaseUrl } from '../server/utils/databaseUrl'

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------
// `internalLabel` is what staff see; `publicLabel` is what the candidate sees.
// The pairing on `security_checks` is the case ZACC specifically asked for: the
// back office tracks a vetting step by name, the candidate is told only that
// their application is under review.

const STAGES = [
  {
    key: 'received', internalLabel: 'Received', publicLabel: 'Application received',
    publicDescription: 'We have your application and your reference number. Nothing is required from you yet.',
    category: 'INTAKE', legacyStatus: 'PENDING', colorHex: '#6B7280', sortOrder: 10,
    isDefault: true, showOnCandidateTimeline: true,
    notifyCandidate: true, templateKey: 'application.received',
    notificationDelayMinutes: 0, notificationDelayJitterMinutes: 0
  },
  {
    key: 'eligibility_screening', internalLabel: 'Eligibility screening', publicLabel: 'Under review',
    publicDescription: 'Human Capital is checking your qualifications and experience against the advertised minimum.',
    category: 'SCREENING', legacyStatus: 'REVIEWING', colorHex: '#209341', sortOrder: 20,
    notifyCandidate: false
  },
  {
    key: 'shortlisting', internalLabel: 'Shortlisting', publicLabel: 'Under review',
    publicDescription: 'The panel is ranking eligible applications.',
    category: 'SCREENING', legacyStatus: 'REVIEWING', colorHex: '#209341', sortOrder: 30,
    notifyCandidate: false
  },
  {
    key: 'shortlisted', internalLabel: 'Shortlisted', publicLabel: 'Shortlisted',
    publicDescription: 'You have been shortlisted. Look out for an interview invitation.',
    category: 'ASSESSMENT', legacyStatus: 'SHORTLISTED', colorHex: '#16A34A', sortOrder: 40,
    notifyCandidate: true, templateKey: 'application.shortlisted',
    notificationDelayMinutes: 0
  },
  {
    key: 'interview', internalLabel: 'Interview', publicLabel: 'Interview',
    publicDescription: 'Your interview has been scheduled.',
    category: 'INTERVIEW', legacyStatus: 'INTERVIEWED', colorHex: '#D4AF37', sortOrder: 50,
    notifyCandidate: false
  },
  {
    // The example ZACC gave: internal name is specific, candidate sees something neutral.
    key: 'security_checks', internalLabel: 'Security checks', publicLabel: 'Under review',
    internalDescription: 'Background, criminal-record and asset-declaration verification.',
    publicDescription: 'Your application is under review. We will be in touch once checks are complete.',
    category: 'ASSESSMENT', legacyStatus: 'INTERVIEWED', colorHex: '#B54708', sortOrder: 60,
    notifyCandidate: false
  },
  {
    key: 'reference_checks', internalLabel: 'Reference checks', publicLabel: 'Under review',
    publicDescription: 'We are contacting your referees.',
    category: 'ASSESSMENT', legacyStatus: 'INTERVIEWED', colorHex: '#B54708', sortOrder: 70,
    notifyCandidate: false
  },
  {
    key: 'offer', internalLabel: 'Offer', publicLabel: 'Offer',
    publicDescription: 'Congratulations — an offer is being prepared.',
    category: 'OFFER', legacyStatus: 'ACCEPTED', colorHex: '#16A34A', sortOrder: 80,
    isTerminal: true, notifyCandidate: false
  },
  {
    key: 'reserve', internalLabel: 'Reserve list', publicLabel: 'Reserve list',
    publicDescription:
      'Your application stays on file for six months and is considered first if a further post is created.',
    category: 'CLOSED', legacyStatus: 'REVIEWING', colorHex: '#B54708', sortOrder: 90,
    isTerminal: true, notifyCandidate: true, templateKey: 'application.stage_changed',
    // Held back a working day so it does not read as an instant machine decision.
    notificationDelayMinutes: 1440, notificationDelayJitterMinutes: 120
  },
  {
    key: 'rejected', internalLabel: 'Not taken forward', publicLabel: 'Not successful',
    publicDescription: 'Thank you for your interest. Your application was not taken forward on this occasion.',
    category: 'CLOSED', legacyStatus: 'REJECTED', colorHex: '#B42318', sortOrder: 100,
    isTerminal: true, isRejection: true,
    notifyCandidate: true, templateKey: 'application.rejected',
    // Two working days, jittered, so a batch of rejections does not all land at once.
    notificationDelayMinutes: 2880, notificationDelayJitterMinutes: 240
  },
  {
    key: 'auto_rejected', internalLabel: 'Auto-rejected (criteria)', publicLabel: 'Not successful',
    internalDescription: 'Failed an automatic disqualification rule configured on the vacancy.',
    publicDescription: 'Thank you for your interest. Your application was not taken forward on this occasion.',
    category: 'CLOSED', legacyStatus: 'REJECTED', colorHex: '#B42318', sortOrder: 110,
    isTerminal: true, isRejection: true, isAutoRejectTarget: true,
    notifyCandidate: true, templateKey: 'application.auto_rejected',
    // The longest hold of all: an auto-rejection arriving instantly is exactly what
    // makes a process feel like a machine rather than a panel.
    notificationDelayMinutes: 4320, notificationDelayJitterMinutes: 480
  },
  {
    key: 'withdrawn', internalLabel: 'Withdrawn by candidate', publicLabel: 'Withdrawn',
    publicDescription: 'You withdrew this application.',
    category: 'CLOSED', legacyStatus: 'REJECTED', colorHex: '#6B7280', sortOrder: 120,
    isTerminal: true, showOnCandidateTimeline: true, notifyCandidate: false
  }
] as const

// ---------------------------------------------------------------------------
// Notification templates
// ---------------------------------------------------------------------------

const BRAND = { green: '#209341', gold: '#D4AF37', ink: '#121212' }

/** Wraps body content in the ZACC email shell, matching the existing reports email. */
function shell(bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f5;font-family:'Plus Jakarta Sans',Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr><td style="height:5px;background:linear-gradient(90deg,${BRAND.green} 0 20%,#FCE300 20% 40%,#EF3340 40% 60%,${BRAND.ink} 60% 80%,${BRAND.gold} 80% 100%);"></td></tr>
        <tr><td style="background:${BRAND.ink};padding:20px 28px;">
          <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.02em;">ZACC</div>
          <div style="color:rgba(255,255,255,.6);font-size:12px;">Zimbabwe Anti-Corruption Commission</div>
        </td></tr>
        <tr><td style="padding:28px;color:#121212;font-size:15px;line-height:1.6;">
${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#FAFAF7;color:#6B7280;font-size:12px;line-height:1.5;">
          The Commission charges no fee at any stage of recruitment. Report anyone who asks you for payment.<br>
          {{commission.email}}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

const SIGN_OFF = `<p style="margin:24px 0 0;">Human Capital &amp; Administration<br><strong>Zimbabwe Anti-Corruption Commission</strong></p>`

const TEMPLATES = [
  {
    key: 'application.received',
    name: 'Application received',
    description: 'Acknowledgement sent as soon as an application is submitted.',
    subject: 'Application received — {{reference}}',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>We have received your application for the post of <strong>{{vacancy.title}}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;border-left:4px solid ${BRAND.gold};background:#FAFAF7;padding:16px 20px;">
  <tr><td style="font-size:12px;color:#6B7280;">Your reference number</td></tr>
  <tr><td style="font-size:18px;font-weight:800;">{{reference}}</td></tr>
</table>
<p>Keep this reference — it is how you track progress. Shortlisted candidates are contacted within 21 days of the closing date.</p>${SIGN_OFF}`),
    variables: ['firstName', 'reference', 'vacancy.title', 'vacancy.closingDate'],
    isSystem: true
  },
  {
    key: 'application.shortlisted',
    name: 'Shortlisted',
    description: 'Sent when an application moves to the Shortlisted stage.',
    subject: 'You have been shortlisted — {{vacancy.title}}',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>Following review of applications for <strong>{{vacancy.title}}</strong>, you have been shortlisted.</p>
<p>You will receive interview details separately. Please have your original certificates and identity document available.</p>
<p>Your reference remains <strong>{{reference}}</strong>.</p>${SIGN_OFF}`),
    variables: ['firstName', 'reference', 'vacancy.title'],
    isSystem: true
  },
  {
    key: 'application.rejected',
    name: 'Not taken forward',
    description: 'Sent when an application is closed unsuccessfully. Delayed by the stage setting.',
    subject: 'Your application — {{vacancy.title}}',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>Thank you for your interest in the Commission and for the time you spent on your application for <strong>{{vacancy.title}}</strong>.</p>
<p>On this occasion your application has not been taken forward. Competition for this post was strong, and this outcome is not a reflection on your standing or ability.</p>
<p>We encourage you to apply for future vacancies. Your reference for this application was {{reference}}.</p>${SIGN_OFF}`),
    variables: ['firstName', 'reference', 'vacancy.title'],
    isSystem: true
  },
  {
    key: 'application.auto_rejected',
    name: 'Not taken forward (criteria not met)',
    description: 'Sent when an automatic disqualification rule closes an application.',
    subject: 'Your application — {{vacancy.title}}',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>Thank you for applying for <strong>{{vacancy.title}}</strong>.</p>
<p>After reviewing your application against the requirements advertised for this post, we are unable to take it forward on this occasion.</p>
{{#if publicReason}}<p>{{publicReason}}</p>{{/if}}
<p>You are welcome to apply for future vacancies where your qualifications and experience match the advertised requirements.</p>${SIGN_OFF}`),
    variables: ['firstName', 'reference', 'vacancy.title', 'publicReason'],
    isSystem: true
  },
  {
    key: 'application.stage_changed',
    name: 'Application status update',
    description: 'Generic update. Uses the stage PUBLIC label — never the internal one.',
    subject: 'Update on your application — {{reference}}',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>There is an update on your application for <strong>{{vacancy.title}}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;border-left:4px solid ${BRAND.green};background:#FAFAF7;padding:16px 20px;">
  <tr><td style="font-size:12px;color:#6B7280;">Current status</td></tr>
  <tr><td style="font-size:16px;font-weight:700;">{{status}}</td></tr>
  {{#if statusDescription}}<tr><td style="padding-top:6px;color:#374151;">{{statusDescription}}</td></tr>{{/if}}
</table>${SIGN_OFF}`),
    variables: ['firstName', 'reference', 'vacancy.title', 'status', 'statusDescription'],
    isSystem: true
  },
  {
    key: 'interview.invitation',
    name: 'Interview invitation',
    subject: 'Interview invitation — {{vacancy.title}}',
    description: 'Sent when a candidate is invited to an interview.',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>You are invited to attend an interview for the post of <strong>{{vacancy.title}}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;border-left:4px solid ${BRAND.gold};background:#FAFAF7;padding:16px 20px;">
  <tr><td style="color:#6B7280;width:90px;">Date</td><td><strong>{{interview.date | day}}</strong></td></tr>
  <tr><td style="color:#6B7280;">Time</td><td><strong>{{interview.time}}</strong></td></tr>
  <tr><td style="color:#6B7280;">Venue</td><td>{{interview.venue}}</td></tr>
</table>
{{#if interview.bring}}<p><strong>Please bring:</strong></p><ul>{{#each interview.bring}}<li>{{this}}</li>{{/each}}</ul>{{/if}}
<p>Please confirm your attendance by {{interview.confirmBy | date}}.</p>${SIGN_OFF}`),
    variables: ['firstName', 'vacancy.title', 'interview.date', 'interview.time', 'interview.venue', 'interview.bring', 'interview.confirmBy'],
    isSystem: true
  },
  {
    key: 'document.action_needed',
    name: 'Document action needed',
    description: 'Sent when a submitted document is rejected or needs replacing.',
    subject: 'Action needed on your application — {{reference}}',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>We need one more thing before your application for <strong>{{vacancy.title}}</strong> can proceed.</p>
{{#if documentNote}}<p>{{documentNote}}</p>{{/if}}
<p>You can upload a replacement from your account.</p>${SIGN_OFF}`),
    variables: ['firstName', 'reference', 'vacancy.title', 'documentNote'],
    isSystem: true
  },
  {
    key: 'candidate.verify_email',
    name: 'Verify your email address',
    description: 'Sent on candidate registration.',
    subject: 'Confirm your email address',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>Confirm your email address to activate your ZACC careers account.</p>
<p style="margin:24px 0;"><a href="{{verifyUrl}}" style="background:${BRAND.green};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;display:inline-block;">Confirm email address</a></p>
<p style="color:#6B7280;font-size:13px;">This link expires in 24 hours. If you did not create an account, ignore this message.</p>${SIGN_OFF}`),
    variables: ['firstName', 'verifyUrl'],
    isSystem: true
  },
  {
    key: 'candidate.password_reset',
    name: 'Reset your password',
    description: 'Sent when a candidate requests a password reset.',
    subject: 'Reset your password',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
<p>We received a request to reset the password on your ZACC careers account.</p>
<p style="margin:24px 0;"><a href="{{resetUrl}}" style="background:${BRAND.green};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;display:inline-block;">Reset password</a></p>
<p style="color:#6B7280;font-size:13px;">This link expires in 1 hour. If you did not request this, no action is needed.</p>${SIGN_OFF}`),
    variables: ['firstName', 'resetUrl'],
    isSystem: true
  },
  {
    key: 'message.from_commission',
    name: 'Message from the Commission',
    description: 'Free-text message sent to a candidate from the application dossier.',
    subject: '{{messageSubject}}',
    bodyHtml: shell(`<p>Dear {{firstName}},</p>
{{{messageBody}}}
<p style="color:#6B7280;font-size:13px;margin-top:20px;">Your reference: {{reference}}</p>${SIGN_OFF}`),
    variables: ['firstName', 'reference', 'messageSubject', 'messageBody'],
    isSystem: true
  }
] as const

export async function seedRecruitment(prisma: PrismaClient) {
  console.log('\n🧭 Seeding recruitment notification templates...')
  const templateIds = new Map<string, string>()

  for (const t of TEMPLATES) {
    const row = await prisma.notificationTemplate.upsert({
      where: { key: t.key },
      // Only refresh presentation on re-run; never clobber an admin's edits to
      // isActive, and never resurrect a template they deliberately disabled.
      update: {
        name: t.name,
        description: (t as any).description ?? null,
        variables: [...t.variables] as any
      },
      create: {
        key: t.key,
        name: t.name,
        description: (t as any).description ?? null,
        subject: t.subject,
        bodyHtml: t.bodyHtml,
        variables: [...t.variables] as any,
        isActive: true,
        isSystem: t.isSystem
      },
      select: { id: true, key: true }
    })
    templateIds.set(row.key, row.id)
    console.log(`  ✓ ${t.key}`)
  }

  console.log('\n🪜 Seeding recruitment pipeline stages...')
  for (const s of STAGES) {
    const templateId = (s as any).templateKey ? templateIds.get((s as any).templateKey) ?? null : null
    const data = {
      internalLabel: s.internalLabel,
      publicLabel: s.publicLabel,
      internalDescription: (s as any).internalDescription ?? null,
      publicDescription: (s as any).publicDescription ?? null,
      category: s.category as any,
      legacyStatus: s.legacyStatus as any,
      colorHex: s.colorHex,
      sortOrder: s.sortOrder,
      isDefault: (s as any).isDefault ?? false,
      isTerminal: (s as any).isTerminal ?? false,
      isRejection: (s as any).isRejection ?? false,
      isAutoRejectTarget: (s as any).isAutoRejectTarget ?? false,
      showOnCandidateTimeline: (s as any).showOnCandidateTimeline ?? true,
      notifyCandidate: (s as any).notifyCandidate ?? false,
      notificationTemplateId: templateId,
      notificationDelayMinutes: (s as any).notificationDelayMinutes ?? 0,
      notificationDelayJitterMinutes: (s as any).notificationDelayJitterMinutes ?? 0,
      isSystem: true,
      isActive: true
    }

    await prisma.recruitmentStage.upsert({
      where: { key: s.key },
      // Delays are the one thing HR will tune, so re-seeding must not reset them.
      update: {
        internalLabel: data.internalLabel,
        publicLabel: data.publicLabel,
        internalDescription: data.internalDescription,
        publicDescription: data.publicDescription,
        sortOrder: data.sortOrder,
        isSystem: true
      },
      create: { key: s.key, ...data }
    })
    console.log(`  ✓ ${s.internalLabel}  →  candidate sees "${s.publicLabel}"`)
  }

  console.log('\n✅ Recruitment seed complete.')
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL))
  })
  try {
    await seedRecruitment(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

// Only self-execute when run directly, so `seed.ts` can import seedRecruitment.
if (process.argv[1] && /seed-recruitment\.[tj]s$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error('❌ Error seeding recruitment:', e)
    process.exit(1)
  })
}
