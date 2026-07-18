import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { plannerEvents } from './planner.js'
import { activitySessions } from './activity-tracker.js'
import { goals } from './goals.js'
import { randomUUID } from 'crypto';

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetFrequency: text('target_frequency', { enum: ['daily', 'weekly', 'monthly', 'custom'] }).notNull().default('daily'),
  repeatRule: text('repeat_rule', { mode: 'json' }).notNull(),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  completionCount: integer('completion_count').notNull().default(0),
  missedCount: integer('missed_count').notNull().default(0),
  notes: text('notes'),
  linkedGoalId: text('linked_goal_id').references(() => goals.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userCreatedAtIdx: index('idx_habits_user_created_at').on(table.userId, table.createdAt),
}));

export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  status: text('status', { enum: ['done', 'skipped', 'missed'] }).notNull(),
  linkedEventId: text('linked_event_id').references(() => plannerEvents.id, { onDelete: 'set null' }),
  linkedSessionId: text('linked_session_id').references(() => activitySessions.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  uniqueHabitDate: uniqueIndex('idx_habit_logs_habit_date').on(table.habitId, table.date),
}));