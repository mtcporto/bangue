import { createClient, type Client } from '@libsql/client';
let client: Client | undefined;
export function databaseConfigured() { return !!process.env.TURSO_DATABASE_URL; }
export function getDb(): Client {
  if (!process.env.TURSO_DATABASE_URL) throw new Error('Configure TURSO_DATABASE_URL antes de gravar dados.');
  return client ??= createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
}
export async function migrate() {
  await getDb().batch([
    `CREATE TABLE IF NOT EXISTS imports (id TEXT PRIMARY KEY, period TEXT NOT NULL, fetched_at TEXT NOT NULL, source_hash TEXT NOT NULL, source_html TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL, error TEXT, created_by TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS imports_period ON imports(period, fetched_at)`,
    `CREATE TABLE IF NOT EXISTS schedules (period TEXT PRIMARY KEY, import_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS reviews (issue_id TEXT NOT NULL, source_hash TEXT NOT NULL, resolution TEXT NOT NULL, reviewed_by TEXT NOT NULL, reviewed_at TEXT NOT NULL, PRIMARY KEY(issue_id, source_hash))`,
    `CREATE TABLE IF NOT EXISTS corrections (session_id TEXT NOT NULL, source_hash TEXT NOT NULL, payload TEXT NOT NULL, reason TEXT NOT NULL, corrected_by TEXT NOT NULL, corrected_at TEXT NOT NULL, PRIMARY KEY(session_id, source_hash))`,
    `CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)`
  ], 'write');
}
