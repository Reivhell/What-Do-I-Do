// server/src/scripts/run-migrations.ts
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export async function runMigrations() {
  console.log('[migrations] Starting migrations...');
  
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'what-do-i-do.db');
  const migrationsDir = path.join(process.cwd(), 'src/drizzle/migrations');
  
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
    // Read drizzle's migration journal
    const journalPath = path.join(migrationsDir, 'meta', '_journal.json');
    let journalEntries: Array<{ idx: number; tag: string }> = [];
    
    if (fs.existsSync(journalPath)) {
      const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
      journalEntries = journal.entries || [];
      console.log(`[migrations] Found ${journalEntries.length} migrations in journal`);
    }

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
      // Calculate SHA256 hash of the file content (what drizzle uses)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const hash = crypto.createHash('sha256').update(sql).digest('hex');
      
      // Also get the tag
      const tag = file.replace('.sql', '');
      
      if (appliedHashes.has(hash)) {
        console.log(`[migrations] Skipping ${file} (already applied)`);
        continue;
      }

      // Check if tag is in journal (drizzle's tracking)
      const inJournal = journalEntries.some(e => e.tag === tag);
      
      console.log(`[migrations] Applying ${file} (hash: ${hash.slice(0, 8)})...`);

      // Execute each statement
      const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

      for (const stmt of statements) {
        if (stmt.trim()) {
          sqlite.exec(stmt);
        }
      }

      // Record migration using the hash (what drizzle uses)
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
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
