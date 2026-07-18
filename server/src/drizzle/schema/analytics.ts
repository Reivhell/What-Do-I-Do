import { sqliteTable, text, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { randomUUID } from 'crypto';

// 10. Analytics — cache table for pre-computed heavy aggregations
// See 18-scaling-notes.md for job architecture.
// statisticsCache is defined in ./statistics.ts

export const analyticsSnapshots = sqliteTable('analytics_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  periodType: text('period_type').notNull(), // daily | weekly | monthly | yearly
  periodStart: text('period_start').notNull(), // YYYY-MM-DD
  disciplineScore: real('discipline_score'),
  focusScore: real('focus_score'),
  consistencyScore: real('consistency_score'),
  timeDistribution: text('time_distribution', { mode: 'json' }).notNull().default('{}'),
  generatedAt: text('generated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userPeriodIdx: uniqueIndex('idx_analytics_snapshots_user_period').on(table.userId, table.periodType, table.periodStart),
}));
