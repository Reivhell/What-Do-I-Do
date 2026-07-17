// Snapshot the live DB before drizzle-kit migrate runs, so a failed migration
// can be rolled back by restoring backups/pre-migrate-<ts>.db.
// Uses better-sqlite3 directly (DATABASE_PATH env) — no TS toolchain needed at migrate time.
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, statSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'what-do-i-do.db');
if (!existsSync(dbPath)) {
  console.log('[pre-migrate] no DB file — nothing to back up');
  process.exit(0);
}

const dir = join(process.cwd(), 'backups');
mkdirSync(dir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dest = join(dir, `pre-migrate-${ts}.db`);

const conn = new Database(dbPath, { readonly: true, fileMustExist: true });
try {
  conn.pragma('journal_mode = WAL');
  conn.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
} finally {
  conn.close();
}
console.log(`[pre-migrate] snapshot saved: ${dest}`);
