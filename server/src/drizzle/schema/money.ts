import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { randomUUID } from 'crypto';

// 08. Money
// Soft delete via deleted_at — per 00-architecture.md §4

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['cash', 'bank', 'e_wallet'] }).notNull(),
  currentBalance: real('current_balance').notNull().default(0),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userIdx: index('idx_accounts_user').on(table.userId),
}));

export const recurringBills = sqliteTable('recurring_bills', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  dueDay: integer('due_day').notNull(),
  category: text('category').notNull(),
  status: text('status', { enum: ['paid', 'unpaid'] }).notNull().default('unpaid'),
  reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).notNull().default(true),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userIdx: index('idx_recurring_bills_user').on(table.userId),
}));

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  transferToAccountId: text('transfer_to_account_id').references(() => accounts.id, { onDelete: 'restrict' }),
  linkedRecurringBillId: text('linked_recurring_bill_id').references(() => recurringBills.id, { onDelete: 'set null' }),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userDateIdx: index('idx_transactions_user_date').on(table.userId, table.date),
  userCategoryDateIdx: index('idx_transactions_user_category_date').on(table.userId, table.category, table.date),
  accountIdx: index('idx_transactions_account').on(table.accountId),
}));

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  period: text('period', { enum: ['daily', 'weekly', 'monthly', 'yearly'] }).notNull(),
  amountLimit: real('amount_limit').notNull(),
  periodStart: text('period_start').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userIdx: index('idx_budgets_user').on(table.userId),
  uniqueUserCategoryPeriod: index('idx_budgets_unique').on(table.userId, table.category, table.period, table.periodStart),
}));