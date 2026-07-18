import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { randomUUID } from 'crypto';

// 09. Life Log
// Only physical table is life_log_annotations.
// Timeline is assembled via UNION ALL across 4 source tables + this table.

export const lifeLogAnnotations = sqliteTable('life_log_annotations', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  note: text('note'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userTsIdx: index('idx_life_log_annotations_user_ts').on(table.userId, table.timestamp),
}));
