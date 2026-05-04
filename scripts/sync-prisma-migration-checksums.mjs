/**
 * After editing an already-applied migration.sql, Prisma wants `migrate reset`
 * because `_prisma_migrations.checksum` no longer matches the file.
 *
 * Do NOT pipe `npm run … | prisma db execute` — npm prints banner lines into the pipe and breaks SQL.
 *
 *   node scripts/sync-prisma-migration-checksums.mjs           # print SQL only
 *   node scripts/sync-prisma-migration-checksums.mjs --apply   # run prisma db execute (recommended)
 *   npm run prisma:fix-checksums:apply                         # same as --apply
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const migrationsDir = join(root, 'prisma', 'migrations')

/** Folder names under prisma/migrations whose checksums you need to refresh. */
const TARGETS = new Set(['20260504133155_citizen_heero', '20260505140000_citizen_hero'])

function checksumForMigrationFolder(name) {
  const sqlPath = join(migrationsDir, name, 'migration.sql')
  const buf = readFileSync(sqlPath)
  return createHash('sha256').update(buf).digest('hex')
}

function buildSql() {
  const lines = [
    '-- Sync Prisma migration checksums after editing migration.sql (no DB reset).',
    ''
  ]

  for (const name of readdirSync(migrationsDir)) {
    if (!TARGETS.has(name)) continue
    const p = join(migrationsDir, name)
    if (!statSync(p).isDirectory()) continue
    const checksum = checksumForMigrationFolder(name)
    lines.push(
      `UPDATE \`_prisma_migrations\` SET \`checksum\` = '${checksum}' WHERE \`migration_name\` = '${name}';`
    )
  }

  lines.push('')
  return lines.join('\n')
}

function applyToDatabase(sql) {
  const child = spawn('npx', ['prisma', 'db', 'execute', '--stdin'], {
    cwd: root,
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit']
  })

  child.stdin.write(sql, 'utf8')
  child.stdin.end()

  child.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  child.on('close', (code) => {
    process.exit(code ?? 0)
  })
}

const sql = buildSql()

if (process.argv.includes('--apply')) {
  applyToDatabase(sql)
} else {
  process.stdout.write(sql)
}
