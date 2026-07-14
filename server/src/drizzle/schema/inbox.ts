import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { randomUUID } from 'crypto';

// 02. Inbox / Capture

export const captureItems = sqliteTable('capture_items', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rawText: text('raw_text').notNull(),
  capturedAt: text('captured_at').notNull().$defaultFn(() => new Date().toISOString()),
  source: text('source').notNull().default('manual'), // manual | voice | share_intent
  detectedDate: text('detected_date'),
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),
  status: text('status').notNull().default('unprocessed'), // unprocessed | processed | archived
  convertedToType: text('converted_to_type'), // task | planner_event | habit | goal | money_note
  convertedToId: text('converted_to_id'), // polymorphic FK, validated in app layer
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
