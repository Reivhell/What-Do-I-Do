import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { BackupService } from '../../common/backup/backup.service';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, gt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';

// Validate the import envelope + that every table payload is an array of row objects.
const ImportBodySchema = z.object({
  exportedAt: z.string(),
  appVersion: z.string(),
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});
type ImportBody = z.infer<typeof ImportBodySchema>;

const APP_VERSION = process.env.APP_VERSION || '1.0.0';

function parseVersion(v: string): [number, number, number] {
  const parts = v.split('.').map(Number);
  while (parts.length < 3) parts.push(0);
  return [parts[0], parts[1], parts[2]];
}

function compareVersion(a: string, b: string): number {
  const [aMaj, aMin, aPat] = parseVersion(a);
  const [bMaj, bMin, bPat] = parseVersion(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}

export interface ImportValidationResult {
  valid: boolean;
  warnings: string[];
  tableCounts: Record<string, number>;
  estimatedTimeMs: number;
  dryRun: boolean;
  versionMatch: boolean;
  importVersion: string;
  appVersion: string;
}

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
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private readonly backup: BackupService,
  ) {}

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

  // ── Backup Config ──
  getBackupConfig(): { backupDir: string; retentionDays: number; dbPath: string } {
    return this.backup.getConfig();
  }

  updateBackupConfig(config: { backupDir?: string; retentionDays?: number }): { backupDir: string; retentionDays: number } {
    return this.backup.updateConfig(config);
  }

  triggerBackup(label?: string): string {
    return this.backup.backup(label || 'manual');
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
    dryRun = false,
  ): Promise<ImportValidationResult | { dryRun: false; result: Record<string, { imported: number; skipped: number }>; warnings: string[] }> {
    const parsed = ImportBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(`Invalid import payload: ${parsed.error.issues[0]?.message ?? 'malformed'}`);
    }
    const valid = parsed.data;

    // Schema version validation: reject on major mismatch, warn on minor/patch diff
    const versionCmp = compareVersion(valid.appVersion, APP_VERSION);
    const warnings: string[] = [];
    if (versionCmp > 0) {
      throw new BadRequestException(
        `Import version ${valid.appVersion} is newer than current ${APP_VERSION}. Update the app before importing.`,
      );
    }
    if (versionCmp < 0) {
      const [impMaj, curMaj] = parseVersion(valid.appVersion);
      const [curMaj2] = parseVersion(APP_VERSION);
      if (impMaj !== curMaj2) {
        throw new BadRequestException(
          `Major version mismatch: import is ${valid.appVersion} (major ${impMaj}), app is ${APP_VERSION} (major ${curMaj2}). ` +
            `Major versions must match to import.`,
        );
      }
      warnings.push(`Minor/patch version difference: import ${valid.appVersion} vs app ${APP_VERSION}. Proceeding with caution.`);
    }

    // Enhanced validation: check for unknown tables, empty tables, etc.
    const tableCounts: Record<string, number> = {};
    const unknownTables: string[] = [];
    const emptyTables: string[] = [];
    for (const [tableName, rows] of Object.entries(valid.data)) {
      if (!TABLE_KEY_MAP[tableName]) {
        unknownTables.push(tableName);
        continue;
      }
      const count = Array.isArray(rows) ? rows.length : 0;
      tableCounts[tableName] = count;
      if (count === 0) emptyTables.push(tableName);
    }
    if (unknownTables.length) warnings.push(`Unknown tables ignored: ${unknownTables.join(', ')}`);
    if (emptyTables.length) warnings.push(`Empty tables (no rows to import): ${emptyTables.join(', ')}`);

    // Estimated time: rough heuristic ~1ms per row + small overhead
    const totalRows = Object.values(tableCounts).reduce((a, b) => a + b, 0);
    const estimatedTimeMs = Math.max(50, totalRows * 2 + Object.keys(tableCounts).length * 5);

    // Dry-run: return detailed preview without writing
    if (dryRun) {
      return {
        dryRun: true,
        valid: true,
        warnings,
        tableCounts,
        estimatedTimeMs,
        versionMatch: versionCmp === 0,
        importVersion: valid.appVersion,
        appVersion: APP_VERSION,
      } as ImportValidationResult;
    }

    // Safety net: snapshot before any write
    this.backup.backup('pre-import');

    const result: Record<string, { imported: number; skipped: number }> = {};

    for (const [tableName, rows] of Object.entries(valid.data)) {
      const schemaKey = TABLE_KEY_MAP[tableName];
      if (!schemaKey || !Array.isArray(rows)) continue;

      const tableDef = (schema as any)[schemaKey];
      let imported = 0;
      let skipped = 0;

      for (const row of rows) {
        try {
          const result = await this.db.insert(tableDef).values(row as any).onConflictDoNothing().execute();
          if ((result as any)?.changes > 0) imported++; else skipped++;
        } catch {
          skipped++;
        }
      }

      result[tableName] = { imported, skipped };
    }

    return { dryRun: false, result, warnings } as ImportValidationResult & { dryRun: false; result: Record<string, { imported: number; skipped: number }>; warnings: string[] };
  }

  async validateImport(body: { exportedAt: string; appVersion: string; data: Record<string, unknown[]> }): Promise<ImportValidationResult> {
    const result = await this.importData('validation-only', body, true);
    if ('valid' in result) return result;
    throw new BadRequestException('Validation failed unexpectedly');
  }

  async getPinSettings(userId: string): Promise<{ enabled: boolean; autoLockMinutes: number }> {
    const pinSettings = await this.db.query.pinSettings.findFirst({
      where: (ps, { eq }) => eq(ps.userId, userId),
    });
    return {
      enabled: pinSettings?.enabled ?? false,
      autoLockMinutes: pinSettings?.autoLockMinutes ?? 5,
    };
  }

  async setPin(userId: string, pin: string): Promise<void> {
    const pinHash = await bcrypt.hash(pin, 10);
    await this.db
      .insert(schema.pinSettings)
      .values({
        userId,
        pinHash,
        enabled: true,
        autoLockMinutes: 5,
        failedAttempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: schema.pinSettings.userId,
        set: {
          pinHash,
          enabled: true,
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date().toISOString(),
        },
      })
      .execute();
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const pinSettings = await this.db.query.pinSettings.findFirst({
      where: (ps, { eq }) => eq(ps.userId, userId),
    });

    if (!pinSettings || !pinSettings.pinHash || !pinSettings.enabled) {
      return false;
    }

    // Check if locked out
    if (pinSettings.lockedUntil && new Date(pinSettings.lockedUntil) > new Date()) {
      return false;
    }

    const isValid = await bcrypt.compare(pin, pinSettings.pinHash);

    if (isValid) {
      // Reset failed attempts on success
      await this.db
        .update(schema.pinSettings)
        .set({
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.pinSettings.userId, userId))
        .execute();
      return true;
    } else {
      // Increment failed attempts
      const newAttempts = (pinSettings.failedAttempts ?? 0) + 1;
      const updates: Record<string, unknown> = {
        failedAttempts: newAttempts,
        updatedAt: new Date().toISOString(),
      };

      // Lock for 30 seconds after 3 failed attempts
      if (newAttempts >= 3) {
        const lockUntil = new Date(Date.now() + 30 * 1000).toISOString();
        updates.lockedUntil = lockUntil;
      }

      await this.db
        .update(schema.pinSettings)
        .set(updates)
        .where(eq(schema.pinSettings.userId, userId))
        .execute();
      return false;
    }
  }

  async updatePinSettings(
    userId: string,
    data: { enabled?: boolean; autoLockMinutes?: number },
  ): Promise<void> {
    const pinSettings = await this.db.query.pinSettings.findFirst({
      where: (ps, { eq }) => eq(ps.userId, userId),
    });

    if (!pinSettings) {
      throw new NotFoundException('PIN settings not found. Set a PIN first.');
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.enabled !== undefined) updates.enabled = data.enabled;
    if (data.autoLockMinutes !== undefined) updates.autoLockMinutes = data.autoLockMinutes;

    await this.db
      .update(schema.pinSettings)
      .set(updates)
      .where(eq(schema.pinSettings.userId, userId))
      .execute();
  }

  async clearPin(userId: string): Promise<void> {
    await this.db
      .update(schema.pinSettings)
      .set({
        pinHash: null,
        enabled: false,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.pinSettings.userId, userId))
      .execute();
  }
}
