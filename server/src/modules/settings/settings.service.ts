import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const APP_VERSION = process.env.APP_VERSION || '1.0.0';

const TABLE_KEY_MAP: Record<string, string> = {
  activity_sessions: 'activitySessions',
  capture_items: 'captureItems',
  tasks: 'tasks',
  subtasks: 'subtasks',
  planner_events: 'plannerEvents',
  goals: 'goals',
  milestones: 'milestones',
  habits: 'habits',
  habit_logs: 'habitLogs',
  accounts: 'accounts',
  transactions: 'transactions',
  budgets: 'budgets',
  recurring_bills: 'recurringBills',
  life_log_annotations: 'lifeLogAnnotations',
  achievement_definitions: 'achievementDefinitions',
  user_achievements: 'userAchievements',
  insights: 'insights',
  layout_presets: 'layoutPresets',
  user_profiles: 'userProfiles',
  user_preferences: 'userPreferences',
  notification_settings: 'notificationSettings',
  category_definitions: 'categoryDefinitions',
};

// Tables without direct userId column — exported un-filtered (single-user app)
const CHILD_TABLE_NAMES = new Set(['subtasks', 'milestones', 'habit_logs', 'achievement_definitions']);

@Injectable()
export class SettingsService {
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}

  // ── Profile ──
  async getProfile(userId: string) {
    return this.db.query.userProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, userId),
    });
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; avatarUrl?: string; bio?: string }) {
    return this.db
      .update(schema.userProfiles)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.userProfiles.userId, userId))
      .returning();
  }

  // ── Preferences ──
  async getPreferences(userId: string) {
    return this.db.query.userPreferences.findFirst({
      where: (prefs, { eq }) => eq(prefs.userId, userId),
    });
  }

  async updatePreferences(
    userId: string,
    data: {
      theme?: string;
      language?: string;
      currency?: string;
      timezone?: string;
      dateFormat?: string;
      timeFormat?: string;
      categoryTimeMapping?: Record<string, string>;
    },
  ) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat;
    if (data.timeFormat !== undefined) updateData.timeFormat = data.timeFormat;
    if (data.categoryTimeMapping !== undefined) updateData.categoryTimeMapping = JSON.stringify(data.categoryTimeMapping);

    return this.db
      .update(schema.userPreferences)
      .set(updateData)
      .where(eq(schema.userPreferences.userId, userId))
      .returning();
  }

  // ── Notifications ──
  async getNotifications(userId: string) {
    return this.db.query.notificationSettings.findFirst({
      where: (notifs, { eq }) => eq(notifs.userId, userId),
    });
  }

  async updateNotifications(
    userId: string,
    data: {
      plannerReminderEnabled?: boolean;
      habitReminderEnabled?: boolean;
      budgetAlertEnabled?: boolean;
      goalReminderEnabled?: boolean;
      achievementAlertEnabled?: boolean;
    },
  ) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.plannerReminderEnabled !== undefined) updateData.plannerReminderEnabled = data.plannerReminderEnabled;
    if (data.habitReminderEnabled !== undefined) updateData.habitReminderEnabled = data.habitReminderEnabled;
    if (data.budgetAlertEnabled !== undefined) updateData.budgetAlertEnabled = data.budgetAlertEnabled;
    if (data.goalReminderEnabled !== undefined) updateData.goalReminderEnabled = data.goalReminderEnabled;
    if (data.achievementAlertEnabled !== undefined) updateData.achievementAlertEnabled = data.achievementAlertEnabled;

    return this.db
      .update(schema.notificationSettings)
      .set(updateData)
      .where(eq(schema.notificationSettings.userId, userId))
      .returning();
  }

  // ── Categories ──
  async getCategories(userId: string, domain?: string) {
    const conditions = [eq(schema.categoryDefinitions.userId, userId)];
    if (domain) conditions.push(eq(schema.categoryDefinitions.domain, domain));

    return this.db.query.categoryDefinitions.findMany({
      where: (cats, { eq, and }) => and(...conditions),
    });
  }

  async createCategory(
    userId: string,
    data: { domain: string; name: string; color: string },
  ) {
    const [category] = await this.db
      .insert(schema.categoryDefinitions)
      .values({
        id: randomUUID(),
        userId,
        domain: data.domain,
        name: data.name,
        color: data.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return category;
  }

  async deleteCategory(categoryId: string) {
    return this.db
      .delete(schema.categoryDefinitions)
      .where(eq(schema.categoryDefinitions.id, categoryId))
      .returning();
  }

  // ── Export/Import ──

  async exportData(userId: string) {
    const data: Record<string, unknown[]> = {};

    for (const [tableName, schemaKey] of Object.entries(TABLE_KEY_MAP)) {
      const tableDef = (schema as any)[schemaKey];
      if (!tableDef) continue;
      try {
        data[tableName] = CHILD_TABLE_NAMES.has(tableName)
          ? await this.db.select().from(tableDef)
          : await this.db.select().from(tableDef).where(eq(tableDef.userId, userId));
      } catch (e: any) {
        // ponytail: log and skip failing tables
        data[tableName] = [];
      }
    }

    return {
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      data,
    };
  }

  async importData(
    userId: string,
    body: { exportedAt: string; appVersion: string; data: Record<string, unknown[]> },
  ) {
    if (body.appVersion !== APP_VERSION) {
      throw new BadRequestException(`Version mismatch: expected ${APP_VERSION}, got ${body.appVersion}`);
    }

    const result: Record<string, { imported: number; skipped: number }> = {};

    for (const [tableName, rows] of Object.entries(body.data)) {
      const schemaKey = TABLE_KEY_MAP[tableName];
      if (!schemaKey || !Array.isArray(rows)) continue;

      const tableDef = (schema as any)[schemaKey];
      let imported = 0;
      let skipped = 0;

      for (const row of rows) {
        try {
          const result = await this.db.insert(tableDef).values(row as any).onConflictDoNothing().execute();
          // onConflictDoNothing succeeds even on no-op; check changes to count correctly
          if ((result as any)?.changes > 0) imported++; else skipped++;
        } catch {
          skipped++;
        }
      }

      result[tableName] = { imported, skipped };
    }

    return result;
  }
}
