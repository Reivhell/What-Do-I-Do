import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { randomUUID } from 'crypto';

// 03. Planner
// realized_session_id and activity_sessions.source_event_id form a circular reference.
// In SQLite this is handled by running all CREATE TABLE in one batch before any INSERT.
// In Drizzle TypeScript, cross-file circular refs use simple text fields (FK validated at DB level).

export const plannerEvents = sqliteTable('planner_events', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(), // derived saat write, disimpan untuk query cepat
  category: text('category'),
  priority: text('priority').notNull().default('medium'), // low | medium | high
  notes: text('notes'),
  repeatRule: text('repeat_rule', { mode: 'json' }), // JSON: { freq, interval, days_of_week, end_condition }
  reminderTime: text('reminder_time'),
  sourceType: text('source_type').notNull().default('manual'), // manual | task | habit | goal_milestone
  sourceId: text('source_id'), // polymorphic: Task | Habit | Milestone, tergantung source_type
  status: text('status').notNull().default('scheduled'), // scheduled | in_progress | completed | missed | cancelled
  realizedSessionId: text('realized_session_id'), // FK → activity_sessions.id (validated at DB migration)
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
