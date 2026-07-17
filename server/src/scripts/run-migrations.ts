// server/src/scripts/run-migrations.ts
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const __filename = require.main!.filename;
const __dirname = path.dirname(__filename);

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'what-do-i-do.db');
  const migrationsDir = path.join(process.cwd(), 'src/drizzle/migrations');

export async function runMigrations() {
  console.log('[migrations] Starting migrations...');
  console.log(`[migrations] DB path: ${dbPath}`);
  console.log(`[migrations] Migrations dir: ${migrationsDir}`);

  if (!fs.existsSync(migrationsDir)) {
    console.log('[migrations] No migrations directory found, skipping');
    return;
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  try {
    // Create migrations tracking table if it doesn't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        hash TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    const appliedMigrations = sqlite.prepare('SELECT hash FROM __drizzle_migrations').all() as { hash: string }[];
    const appliedHashes = new Set(appliedMigrations.map(m => m.hash));

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const hash = file;
      if (appliedHashes.has(hash)) {
        console.log(`[migrations] Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`[migrations] Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      // Execute each statement
      const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

      for (const stmt of statements) {
        if (stmt.trim()) {
          sqlite.exec(stmt);
        }
      }

      // Record migration
      sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(hash, Date.now());
      console.log(`[migrations] Applied ${file}`);
    }

    console.log('[migrations] All migrations completed successfully');
  } catch (error) {
    console.error('[migrations] Migration failed:', error);
    throw error;
  } finally {
    sqlite.close();
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}