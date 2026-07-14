import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { plannerEvents } from './planner';
import { randomUUID } from 'crypto';

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: text('target_date'),
  status: text('status').notNull().default('active'),
  progressPercent: real('progress_percent').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const milestones = sqliteTable('milestones', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  goalId: text('goal_id').notNull().references(() => goals.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  targetDate: text('target_date'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  generatedEventId: text('generated_event_id').references(() => plannerEvents.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
