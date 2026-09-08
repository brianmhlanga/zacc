/**
 * Parses DATABASE_URL into the pool config the MariaDB adapter expects.
 *
 * Replaces a pair of hand-rolled regexes that were duplicated in
 * `server/utils/prisma.ts` and `prisma/seed.ts`. They mis-parsed two cases that
 * both occur in practice:
 *
 *   mysql://root:@localhost:3306/zacc
 *     The "with password" pattern required a non-empty password, so it fell
 *     through to the "no password" pattern, which greedily captured `root:` —
 *     trailing colon included — as the username. Connecting then failed with
 *     "Access denied for user 'root:'".
 *
 *   mysql://user:p%40ss%3Aword@host:3306/db
 *     Any password containing an encoded @ or : broke the capture groups, so a
 *     strong production password could not be expressed at all.
 *
 * The WHATWG URL parser handles both, plus percent-decoding, for free.
 */

export interface DatabasePoolConfig {
  host: string
  port: number
  user: string
  password: string | undefined
  database: string
}

export function parseDatabaseUrl(url: string | undefined): DatabasePoolConfig {
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.')
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      `Invalid DATABASE_URL format: ${redact(url)}. Expected mysql://user:password@host:port/database`
    )
  }

  if (parsed.protocol !== 'mysql:') {
    throw new Error(`DATABASE_URL must use the mysql:// protocol, got "${parsed.protocol}//"`)
  }

  const database = parsed.pathname.replace(/^\//, '')
  if (!database) {
    throw new Error(`DATABASE_URL is missing a database name: ${redact(url)}`)
  }
  if (!parsed.hostname) {
    throw new Error(`DATABASE_URL is missing a host: ${redact(url)}`)
  }

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    // An empty password is legitimate on a local dev instance, but it must be
    // undefined rather than '' so the driver omits authentication cleanly.
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    database
  }
}

/** Masks the password so a malformed URL can be logged without leaking it. */
export function redact(url: string): string {
  return url.replace(/(\/\/[^:/@]+):([^@]*)@/, '$1:****@')
}
