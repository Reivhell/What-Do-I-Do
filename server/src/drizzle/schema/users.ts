import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { randomUUID } from 'crypto';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // nullable: app-lock lokal (PIN/biometric) opsional
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
