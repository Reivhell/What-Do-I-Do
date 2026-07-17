import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SettingsModule } from '../src/modules/settings/settings.module';
import { SettingsService } from '../src/modules/settings/settings.service';
import { getTestDb, createTestUser, resetTestDb, closeTestDb } from './setup';
import * as schema from '../src/drizzle/schema';

describe('Import/Export Integration (e2e)', () => {
  let app: INestApplication;
  let service: SettingsService;
  let db: ReturnType<typeof getTestDb>;
  let testUser: { id: string; email: string };

  beforeAll(async () => {
    db = getTestDb();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SettingsModule],
    })
      .overrideProvider('DRIZZLE')
      .useValue(db)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<SettingsService>(SettingsService);
  });

  afterAll(async () => {
    closeTestDb();
    await app.close();
  });

  beforeEach(() => {
    resetTestDb();
    testUser = createTestUser(db);
  });

  describe('Export → Import Roundtrip', () => {
    it('should export and import user data completely', async () => {
      // Create test data across multiple tables
      db.insert(schema.tasks).values([
        { id: 'task-1', userId: testUser.id, title: 'Task 1', completed: 0, priority: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'task-2', userId: testUser.id, title: 'Task 2', completed: 1, priority: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]).run();

      db.insert(schema.habits).values({
        id: 'habit-1',
        userId: testUser.id,
        name: 'Exercise',
        frequency: 'daily',
        targetCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      db.insert(schema.habitCompletions).values({
        id: 'completion-1',
        habitId: 'habit-1',
        userId: testUser.id,
        completedAt: new Date().toISOString(),
        count: 1,
        createdAt: new Date().toISOString(),
      }).run();

      db.insert(schema.goals).values({
        id: 'goal-1',
        userId: testUser.id,
        title: 'Learn TypeScript',
        targetValue: 100,
        currentValue: 50,
        unit: 'hours',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      db.insert(schema.moneyAccounts).values({
        id: 'account-1',
        userId: testUser.id,
        name: 'Cash',
        type: 'cash',
        balance: 100000,
        currency: 'IDR',
        isDefault: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      db.insert(schema.moneyTransactions).values({
        id: 'txn-1',
        userId: testUser.id,
        accountId: 'account-1',
        amount: 50000,
        type: 'expense',
        description: 'Coffee',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      await service.setPin(testUser.id, '1234');

      // Export
      const exported = await service.getConfig(testUser.id);

      expect(exported.data.tasks).toHaveLength(2);
      expect(exported.data.habits).toHaveLength(1);
      expect(exported.data.habit_completions).toHaveLength(1);
      expect(exported.data.goals).toHaveLength(1);
      expect(exported.data.money_accounts).toHaveLength(1);
      expect(exported.data.money_transactions).toHaveLength(1);
      expect(exported.data.pin_settings).toHaveLength(1);
      expect(exported.data.pin_settings[0].pinHash).toBeUndefined();

      // Create new user for import
      const newUser = createTestUser(db, { id: 'new-user-' + Date.now() });

      // Import
      const result = await service.importConfig(newUser.id, exported);

      expect(result.success).toBe(true);
      expect(result.importedTables.length).toBeGreaterThan(0);

      // Verify imported data
      const importedTasks = db.select().from(schema.tasks).where(schema.eq(schema.tasks.userId, newUser.id)).all();
      expect(importedTasks).toHaveLength(2);
      expect(importedTasks.map(t => t.title).sort()).toEqual(['Task 1', 'Task 2']);

      const importedHabits = db.select().from(schema.habits).where(schema.eq(schema.habits.userId, newUser.id)).all();
      expect(importedHabits).toHaveLength(1);
      expect(importedHabits[0].name).toBe('Exercise');

      const importedGoals = db.select().from(schema.goals).where(schema.eq(schema.goals.userId, newUser.id)).all();
      expect(importedGoals).toHaveLength(1);
      expect(importedGoals[0].title).toBe('Learn TypeScript');

      const importedAccounts = db.select().from(schema.moneyAccounts).where(schema.eq(schema.moneyAccounts.userId, newUser.id)).all();
      expect(importedAccounts).toHaveLength(1);
      expect(importedAccounts[0].name).toBe('Cash');

      const importedTxns = db.select().from(schema.moneyTransactions).where(schema.eq(schema.moneyTransactions.userId, newUser.id)).all();
      expect(importedTxns).toHaveLength(1);

      const importedPin = db.select().from(schema.pinSettings).where(schema.eq(schema.pinSettings.userId, newUser.id)).get();
      expect(importedPin.enabled).toBe(true);
      expect(importedPin.pinHash).toBeNull(); // PIN hash not imported
    });

    it('should preserve user profile and preferences on import', async () => {
      // Update user profile
      db.update(schema.userProfiles)
        .set({ name: 'Updated Name', bio: 'Test bio', updatedAt: new Date().toISOString() })
        .where(schema.eq(schema.userProfiles.userId, testUser.id))
        .run();

      // Update preferences
      db.update(schema.userPreferences)
        .set({ theme: 'dark', currency: 'USD', updatedAt: new Date().toISOString() })
        .where(schema.eq(schema.userPreferences.userId, testUser.id))
        .run();

      const exported = await service.getConfig(testUser.id);
      const newUser = createTestUser(db, { id: 'new-user-' + Date.now() });

      await service.importConfig(newUser.id, exported);

      const importedProfile = db.select().from(schema.userProfiles).where(schema.eq(schema.userProfiles.userId, newUser.id)).get();
      expect(importedProfile.name).toBe('Updated Name');
      expect(importedProfile.bio).toBe('Test bio');

      const importedPrefs = db.select().from(schema.userPreferences).where(schema.eq(schema.userPreferences.userId, newUser.id)).get();
      expect(importedPrefs.theme).toBe('dark');
      expect(importedPrefs.currency).toBe('USD');
    });
  });

  describe('Import Validation Endpoint', () => {
    it('should validate import payload structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/settings/import/validate')
        .send({ invalid: 'payload' })
        .expect(400);

      expect(response.body.message).toContain('Invalid import payload');
    });

    it('should accept valid import payload', async () => {
      const validPayload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          user_profiles: [{ userId: testUser.id, name: 'Test', email: 'test@test.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/settings/import/validate')
        .send(validPayload)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid version format', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: 'not-a-version',
        data: {},
      };

      const response = await request(app.getHttpServer())
        .post('/settings/import/validate')
        .send(payload)
        .expect(400);

      expect(response.body.valid).toBe(false);
    });

    it('should validate each table data is array', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          tasks: 'not-an-array',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/settings/import/validate')
        .send(payload)
        .expect(200);

      expect(response.body.valid).toBe(true); // Structure is valid, just table data validation happens at import
      expect(response.body.warnings).toContain('tasks: expected array');
    });
  });

  describe('Version Mismatch Rejection', () => {
    it('should reject major version mismatch', async () => {
      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: '2.0.0',
        data: {},
      };

      await expect(service.importConfig(testUser.id, exportData))
        .rejects.toThrow('Major version mismatch');
    });

    it('should reject future major version', async () => {
      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: '99.0.0',
        data: {},
      };

      await expect(service.importConfig(testUser.id, exportData))
        .rejects.toThrow('Major version mismatch');
    });

    it('should accept minor version difference', async () => {
      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.2.0',
        data: {
          user_profiles: [{ userId: testUser.id, name: 'Test', email: 'test@test.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        },
      };

      const result = await service.importConfig(testUser.id, exportData);
      expect(result.success).toBe(true);
    });

    it('should accept patch version difference', async () => {
      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.5',
        data: {
          user_profiles: [{ userId: testUser.id, name: 'Test', email: 'test@test.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        },
      };

      const result = await service.importConfig(testUser.id, exportData);
      expect(result.success).toBe(true);
    });

    it('should reject via HTTP endpoint for version mismatch', async () => {
      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: '2.0.0',
        data: {},
      };

      const response = await request(app.getHttpServer())
        .post('/settings/import')
        .send(exportData)
        .expect(400);

      expect(response.body.message).toContain('Major version mismatch');
    });
  });

  describe('Import idempotency', () => {
    it('should be idempotent - importing twice produces same result', async () => {
      db.insert(schema.tasks).values({
        id: 'task-1',
        userId: testUser.id,
        title: 'Task 1',
        completed: 0,
        priority: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      const exported = await service.getConfig(testUser.id);
      const newUser = createTestUser(db, { id: 'new-user-' + Date.now() });

      await service.importConfig(newUser.id, exported);
      const result2 = await service.importConfig(newUser.id, exported);

      expect(result2.success).toBe(true);

      const tasks = db.select().from(schema.tasks).where(schema.eq(schema.tasks.userId, newUser.id)).all();
      expect(tasks).toHaveLength(1);
    });

    it('should handle duplicate IDs gracefully', async () => {
      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          tasks: [
            { id: 'same-id', userId: testUser.id, title: 'Task 1', completed: 0, priority: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: 'same-id', userId: testUser.id, title: 'Task 2', completed: 0, priority: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        },
      };

      const newUser = createTestUser(db, { id: 'new-user-' + Date.now() });
      const result = await service.importConfig(newUser.id, exportData);

      expect(result.success).toBe(true);
      // Should only import one due to primary key constraint
      const tasks = db.select().from(schema.tasks).where(schema.eq(schema.tasks.userId, newUser.id)).all();
      expect(tasks).toHaveLength(1);
    });
  });
});