// server/src/drizzle/schema/achievements.ts
import { sqliteTable, text, real, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.js'
import { randomUUID } from 'crypto';

export const achievementDefinitions = sqliteTable('achievement_definitions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requirementType: text('requirement_type').notNull(),
  requirementValue: real('requirement_value').notNull(),
  icon: text('icon').notNull(),
  category: text('category').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const userAchievements = sqliteTable('user_achievements', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull().references(() => achievementDefinitions.id, { onDelete: 'cascade' }),
  progress: real('progress').notNull().default(0),
  unlockedAt: text('unlocked_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userAchievementUnique: uniqueIndex('idx_user_achievement_unique').on(table.userId, table.achievementId),
  userIdx: index('idx_user_achievements_user').on(table.userId),
}));
