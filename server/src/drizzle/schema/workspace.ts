import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';

export const layoutPresets = sqliteTable('layout_presets', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  widgetConfig: text('widget_config', { mode: 'json' }).notNull().default('[]'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userCreatedAtIdx: index('idx_layout_presets_user_created_at').on(table.userId, table.createdAt),
  oneActivePerUser: uniqueIndex('idx_layout_presets_one_active').on(table.userId).where(sql`${table.isActive} = 1`),
}));