import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDatabaseUrl, redact } from '../server/utils/databaseUrl'

test('parses a standard url with a password', () => {
  assert.deepEqual(parseDatabaseUrl('mysql://zacc:s3cret@db.internal:3306/zacc_prod'), {
    host: 'db.internal',
    port: 3306,
    user: 'zacc',
    password: 's3cret',
    database: 'zacc_prod'
  })
})

test('parses an empty password without corrupting the username', () => {
  // The exact case that broke the old regexes: user came back as "root:".
  assert.deepEqual(parseDatabaseUrl('mysql://root:@localhost:3306/zacc'), {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: undefined,
    database: 'zacc'
  })
})

test('parses a url with no password segment at all', () => {
  const c = parseDatabaseUrl('mysql://root@localhost:3306/zacc')
  assert.equal(c.user, 'root')
  assert.equal(c.password, undefined)
})

test('percent-decodes credentials containing reserved characters', () => {
  // A strong production password could not previously be expressed.
  const c = parseDatabaseUrl('mysql://svc%40zacc:p%40ss%3Aword%2F1@host:3306/db')
  assert.equal(c.user, 'svc@zacc')
  assert.equal(c.password, 'p@ss:word/1')
})

test('defaults the port to 3306 when omitted', () => {
  assert.equal(parseDatabaseUrl('mysql://root:pw@localhost/zacc').port, 3306)
})

test('rejects a missing url', () => {
  assert.throws(() => parseDatabaseUrl(undefined), /DATABASE_URL environment variable is not set/)
  assert.throws(() => parseDatabaseUrl(''), /DATABASE_URL environment variable is not set/)
})

test('rejects the wrong protocol', () => {
  assert.throws(() => parseDatabaseUrl('postgresql://u:p@h:5432/d'), /must use the mysql:\/\/ protocol/)
})

test('rejects a url with no database name', () => {
  assert.throws(() => parseDatabaseUrl('mysql://root:pw@localhost:3306/'), /missing a database name/)
})

test('error messages never leak the password', () => {
  try {
    parseDatabaseUrl('mysql://root:supersecret@localhost:3306/')
    assert.fail('should have thrown')
  } catch (e: any) {
    assert.ok(!e.message.includes('supersecret'), 'password must be redacted')
    assert.ok(e.message.includes('****'))
  }
  assert.equal(redact('mysql://u:pw@h:3306/d'), 'mysql://u:****@h:3306/d')
})
