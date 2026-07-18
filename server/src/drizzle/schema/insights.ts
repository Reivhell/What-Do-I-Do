import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { analyticsSnapshots } from './analytics.js'
import { randomUUID } from 'crypto';

export const insights = sqliteTable('insights', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['time', 'habit', 'productivity', 'money', 'task', 'goal'] }).notNull(),
  message: text('message').notNull(),
  severity: text('severity', { enum: ['info', 'warning', 'risk'] }).notNull().default('info'),
  sourceMetric: text('source_metric').references(() => analyticsSnapshots.id, { onDelete: 'set null' }),
  generatedAt: text('generated_at').notNull().$defaultFn(() => new Date().toISOString()),
  dismissed: integer('dismissed', { mode: 'boolean' }).notNull().default(false),
}, (table) => ({
  userActiveIdx: uniqueIndex('idx_insights_user_active').on(table.userId, table.dismissed, table.generatedAt),
}));