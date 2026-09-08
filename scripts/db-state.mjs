/**
 * Prints a quick summary of recruitment tables and row counts.
 * Read-only. Run with: node scripts/db-state.mjs
 */
import 'dotenv/config'
import mariadb from 'mariadb'

const u = new URL(process.env.DATABASE_URL)
const conn = await mariadb.createConnection({
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password || ''),
  database: u.pathname.replace(/^\//, '')
})

const one = async (sql) => Number((await conn.query(sql))[0].n)

const RECRUITMENT_TABLES = [
  'candidates', 'candidate_sessions', 'candidate_tokens', 'candidate_profiles',
  'candidate_documents', 'application_drafts', 'vacancy_criteria', 'vacancy_disqualifiers',
  'vacancy_document_slots', 'vacancy_panel_members', 'scoring_templates',
  'recruitment_stages', 'application_stage_events', 'application_qualifications',
  'application_employments', 'application_declarations', 'application_skills',
  'application_keyword_hits', 'application_criterion_scores', 'application_panel_scores',
  'application_reviews', 'application_flags', 'interview_events', 'interview_invitations',
  'application_messages', 'notification_templates', 'email_outbox', 'recruitment_audit_logs'
]

const present = await conn.query(
  `SELECT table_name AS t FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name IN (${RECRUITMENT_TABLES.map(() => '?').join(',')})`,
  RECRUITMENT_TABLES
)
const found = new Set(present.map((r) => r.t))
const missing = RECRUITMENT_TABLES.filter((t) => !found.has(t))

console.log('--- recruitment schema ---')
console.log(`  tables present : ${found.size} / ${RECRUITMENT_TABLES.length}`)
if (missing.length) console.log('  MISSING        :', missing.join(', '))

console.log('\n--- seeded config ---')
console.log('  pipeline stages       :', await one('SELECT COUNT(*) AS n FROM recruitment_stages'))
console.log('  notification templates:', await one('SELECT COUNT(*) AS n FROM notification_templates'))

console.log('\n--- live data ---')
console.log('  jobs         :', await one('SELECT COUNT(*) AS n FROM jobs'))
console.log('  applications :', await one('SELECT COUNT(*) AS n FROM job_applications'))
console.log('  candidates   :', await one('SELECT COUNT(*) AS n FROM candidates'))
console.log('  outbox rows  :', await one('SELECT COUNT(*) AS n FROM email_outbox'))

console.log('\n--- stage label mapping (internal -> candidate) ---')
const stages = await conn.query(
  'SELECT internalLabel, publicLabel, notificationDelayMinutes AS d FROM recruitment_stages ORDER BY sortOrder'
)
for (const s of stages) {
  const delay = Number(s.d) > 0 ? `   [delayed ${Math.round(Number(s.d) / 60)}h]` : ''
  console.log(`  ${s.internalLabel.padEnd(26)} -> ${s.publicLabel}${delay}`)
}

await conn.end()
