import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/drizzle/schema';
import type { DbInstance } from '../src/drizzle';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

let testDb: DbInstance | null = null;

export function getTestDb(): DbInstance {
  if (!testDb) {
    const sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    testDb = drizzle(sqlite, { schema });
  }
  return testDb;
}

export function closeTestDb(): void {
  if (testDb) {
    testDb = null;
  }
}

function createSchema(db: DbInstance): void {
  db.run('PRAGMA foreign_keys = OFF');
  const tables = db.$client.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as { name: string }[];
  for (const table of tables) {
    if (table.name !== 'sqlite_sequence') {
      db.run(`DROP TABLE IF EXISTS ${table.name}`);
    }
  }
  db.run('PRAGMA foreign_keys = ON');

  const schemaSql = `
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'light',
      language TEXT NOT NULL DEFAULT 'id',
      currency TEXT NOT NULL DEFAULT 'IDR',
      timezone TEXT NOT NULL DEFAULT 'Asia/Makassar',
      date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
      time_format TEXT NOT NULL DEFAULT '24h',
      category_time_mapping TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE notification_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      planner_reminder_enabled INTEGER NOT NULL DEFAULT 1,
      habit_reminder_enabled INTEGER NOT NULL DEFAULT 1,
      budget_alert_enabled INTEGER NOT NULL DEFAULT 1,
      goal_reminder_enabled INTEGER NOT NULL DEFAULT 1,
      achievement_alert_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE pin_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      pin_hash TEXT,
      enabled INTEGER NOT NULL DEFAULT 0,
      auto_lock_minutes INTEGER NOT NULL DEFAULT 5,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE category_definitions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      domain TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE planner_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0,
      category_id TEXT REFERENCES category_definitions(id) ON DELETE SET NULL,
      color TEXT,
      recurrence_rule TEXT,
      recurrence_end_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      scheduled_date TEXT,
      category_id TEXT REFERENCES category_definitions(id) ON DELETE SET NULL,
      parent_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL DEFAULT 'daily',
      target_count INTEGER NOT NULL DEFAULT 1,
      reminder_time TEXT,
      color TEXT,
      category_id TEXT REFERENCES category_definitions(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      completed_at TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      target_value INTEGER NOT NULL DEFAULT 1,
      current_value INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'times',
      target_date TEXT,
      category_id TEXT REFERENCES category_definitions(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE money_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'IDR',
      color TEXT,
      icon TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE money_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL REFERENCES money_accounts(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES category_definitions(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE life_log_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      mood INTEGER,
      energy INTEGER,
      stress INTEGER,
      sleep_hours REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE activity_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES category_definitions(id) ON DELETE SET NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes INTEGER,
      category TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;
  db.run(schemaSql);
}

export function resetTestDb(): void {
  const db = getTestDb();
  createSchema(db);
}

export function createTestUser(db: DbInstance, overrides: Partial<{
  id: string;
  email: string;
  passwordHash: string;
}> = {}) {
  const user = {
    id: overrides.id || 'test-user-' + Math.random().toString(36).substring(7),
    email: overrides.email || `test-${Date.now()}@example.com`,
    passwordHash: overrides.passwordHash || '$2b$10$hashedpassword',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.insert(schema.users).values(user).run();

  db.insert(schema.userProfiles).values({
    userId: user.id,
    name: 'Test User',
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }).run();

  db.insert(schema.userPreferences).values({
    userId: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }).run();

  db.insert(schema.notificationSettings).values({
    userId: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }).run();

  db.insert(schema.pinSettings).values({
    userId: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }).run();

  return user;
}