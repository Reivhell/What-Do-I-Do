import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { randomUUID } from 'crypto';

export const statisticsCache = sqliteTable('statistics_cache', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scope: text('scope', { enum: ['overall', 'time', 'activity', 'money', 'habit', 'goal'] }).notNull(),
  computedAt: text('computed_at').notNull(),
  data: text('data').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  uniqueScope: uniqueIndex('idx_statistics_cache_scope').on(table.userId, table.scope),
}));
