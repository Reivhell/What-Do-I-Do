import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as path from 'path';

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let db: DbInstance | null = null;

export function getDb(): DbInstance {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'what-do-i-do.db');
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    db = drizzle(sqlite, { schema });
  }
  return db;
}

export { schema };
