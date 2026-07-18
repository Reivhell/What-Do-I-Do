import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { randomUUID } from 'crypto';

// 04. Activity Tracker
// source_event_id and planner_events.realized_session_id form a circular reference.
// Soft delete via deleted_at — per 00-architecture.md §4.

export const activitySessions = sqliteTable('activity_sessions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityName: text('activity_name').notNull(),
  category: text('category').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'), // nullable selagi live timer masih berjalan
  durationMinutes: integer('duration_minutes'), // derived saat stop, null selagi berjalan
  source: text('source').notNull().default('live'), // live | manual
  note: text('note'),
  sourceEventId: text('source_event_id'), // FK → planner_events.id (validated at DB migration)
  deletedAt: text('deleted_at'), // soft delete wajib per arsitektur
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
