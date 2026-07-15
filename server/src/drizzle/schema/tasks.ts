import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { goals } from './goals';
import { plannerEvents } from './planner';
import { randomUUID } from 'crypto';

// 05. Tasks

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['inbox', 'active', 'completed', 'archived'] }).notNull().default('inbox'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  dueDate: text('due_date'),
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),
  notes: text('notes'),
  linkedGoalId: text('linked_goal_id').references(() => goals.id, { onDelete: 'set null' }),
  scheduledEventId: text('scheduled_event_id').references(() => plannerEvents.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userCreatedAtIdx: index('idx_tasks_user_created_at').on(table.userId, table.createdAt),
  userStatusDueDateIdx: index('idx_tasks_user_status_due_date').on(table.userId, table.status, table.dueDate),
}));

export const subtasks = sqliteTable('subtasks', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
