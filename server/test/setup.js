"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestDb = getTestDb;
exports.closeTestDb = closeTestDb;
exports.resetTestDb = resetTestDb;
exports.createTestUser = createTestUser;
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const better_sqlite3_2 = __importDefault(require("better-sqlite3"));
const schema = __importStar(require("../src/drizzle/schema"));
let testDb = null;
function getTestDb() {
    if (!testDb) {
        const sqlite = new better_sqlite3_2.default(':memory:');
        sqlite.pragma('journal_mode = WAL');
        sqlite.pragma('foreign_keys = ON');
        testDb = (0, better_sqlite3_1.drizzle)(sqlite, { schema });
    }
    return testDb;
}
function closeTestDb() {
    if (testDb) {
        testDb = null;
    }
}
function createSchema(db) {
    db.run('PRAGMA foreign_keys = OFF');
    const tables = db.$client.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
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
function resetTestDb() {
    const db = getTestDb();
    createSchema(db);
}
function createTestUser(db, overrides = {}) {
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
