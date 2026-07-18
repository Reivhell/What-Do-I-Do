import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { randomUUID } from 'crypto';

// 15. Settings — Profile, Preferences, Notifications, Categories

export const userProfiles = sqliteTable('user_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('light'),
  language: text('language').notNull().default('id'),
  currency: text('currency').notNull().default('IDR'),
  timezone: text('timezone').notNull().default('Asia/Makassar'),
  dateFormat: text('date_format').notNull().default('DD/MM/YYYY'),
  timeFormat: text('time_format').notNull().default('24h'),
  categoryTimeMapping: text('category_time_mapping').notNull().default('{}'), // JSON: category → productive|leisure|sleep
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const notificationSettings = sqliteTable('notification_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  plannerReminderEnabled: integer('planner_reminder_enabled', { mode: 'boolean' }).notNull().default(true),
  habitReminderEnabled: integer('habit_reminder_enabled', { mode: 'boolean' }).notNull().default(true),
  budgetAlertEnabled: integer('budget_alert_enabled', { mode: 'boolean' }).notNull().default(true),
  goalReminderEnabled: integer('goal_reminder_enabled', { mode: 'boolean' }).notNull().default(true),
  achievementAlertEnabled: integer('achievement_alert_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const pinSettings = sqliteTable('pin_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  pinHash: text('pin_hash'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  autoLockMinutes: integer('auto_lock_minutes').notNull().default(5),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: text('locked_until'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const categoryDefinitions = sqliteTable('category_definitions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(), // activity | task | money
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
