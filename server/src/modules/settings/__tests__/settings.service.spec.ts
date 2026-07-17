import { SettingsService } from '../settings.service';
import { BackupService } from '../../common/backup/backup.service';
import { getTestDb, createTestUser, resetTestDb } from '../../../test/setup';
import * as schema from '../../../drizzle/schema';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

jest.mock('../../common/backup/backup.service', () => ({
  BackupService: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn(() => ({ backupDir: '/tmp', retentionDays: 14, dbPath: ':memory:' })),
    updateConfig: jest.fn((config) => ({ backupDir: '/tmp', retentionDays: config.retentionDays || 14, dbPath: ':memory:' })),
    backup: jest.fn(() => 'what-do-i-do-test.db'),
  })),
}));
jest.mock('../../common/database/drizzle.provider', () => ({
  DRIZZLE: 'DRIZZLE',
  drizzleProvider: {
    provide: 'DRIZZLE',
    useFactory: () => getTestDb(),
  },
}));

describe('SettingsService', () => {
  let service: SettingsService;
  let db: ReturnType<typeof getTestDb>;
  let testUser: { id: string; email: string };

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(() => {
    resetTestDb();
    testUser = createTestUser(db);

    const module: any = Test.createTestingModule({
      providers: [
        SettingsService,
        BackupService,
        {
          provide: 'DRIZZLE',
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('Backup Config', () => {
    it('should get backup config', () => {
      const config = service.getBackupConfig();
      expect(config).toHaveProperty('backupDir');
      expect(config).toHaveProperty('retentionDays');
      expect(config).toHaveProperty('dbPath');
    });

    it('should update backup config', () => {
      const newConfig = service.updateBackupConfig({ retentionDays: 30 });
      expect(newConfig.retentionDays).toBe(30);
    });

    it('should trigger backup', () => {
      const result = service.triggerBackup('test-label');
      expect(result).toContain('what-do-i-do-');
      expect(result).toContain('.db');
    });
  });

  describe('PIN Settings', () => {
    it('should return PIN settings (disabled by default)', async () => {
      const settings = await service.getPinSettings(testUser.id);
      expect(settings.enabled).toBe(false);
      expect(settings.autoLockMinutes).toBe(5);
    });

    it('should set PIN', async () => {
      await service.setPin(testUser.id, '1234');
      const settings = await service.getPinSettings(testUser.id);
      expect(settings.enabled).toBe(true);
    });

    it('should verify correct PIN', async () => {
      await service.setPin(testUser.id, '1234');
      const result = await service.verifyPin(testUser.id, '1234');
      expect(result).toBe(true);
    });

    it('should reject wrong PIN', async () => {
      await service.setPin(testUser.id, '1234');
      const result = await service.verifyPin(testUser.id, '4321');
      expect(result).toBe(false);
    });

    it('should increment failed attempts on wrong PIN', async () => {
      await service.setPin(testUser.id, '1234');
      await service.verifyPin(testUser.id, 'wrong');
      await service.verifyPin(testUser.id, 'wrong');

      const pinSettings = getTestDb().query.pinSettings.findFirst({
        where: (ps, { eq }) => eq(ps.userId, testUser.id),
      });
      expect(pinSettings?.failedAttempts).toBe(2);
    });

    it('should lock after 3 failed attempts', async () => {
      await service.setPin(testUser.id, '1234');
      await service.verifyPin(testUser.id, 'wrong');
      await service.verifyPin(testUser.id, 'wrong');
      await service.verifyPin(testUser.id, 'wrong');

      const result = await service.verifyPin(testUser.id, '1234');
      expect(result).toBe(false);
    });

    it('should reset failed attempts on success', async () => {
      await service.setPin(testUser.id, '1234');
      await service.verifyPin(testUser.id, 'wrong');
      await service.verifyPin(testUser.id, 'wrong');
      await service.verifyPin(testUser.id, '1234');

      const pinSettings = getTestDb().query.pinSettings.findFirst({
        where: (ps, { eq }) => eq(ps.userId, testUser.id),
      });
      expect(pinSettings?.failedAttempts).toBe(0);
    });

    it('should update PIN settings (enable/disable)', async () => {
      await service.setPin(testUser.id, '1234');
      await service.updatePinSettings(testUser.id, { enabled: false });
      const settings = await service.getPinSettings(testUser.id);
      expect(settings.enabled).toBe(false);
    });

    it('should update autoLockMinutes', async () => {
      await service.setPin(testUser.id, '1234');
      await service.updatePinSettings(testUser.id, { autoLockMinutes: 10 });
      const settings = await service.getPinSettings(testUser.id);
      expect(settings.autoLockMinutes).toBe(10);
    });

    it('should clear PIN', async () => {
      await service.setPin(testUser.id, '1234');
      await service.clearPin(testUser.id);
      const settings = await service.getPinSettings(testUser.id);
      expect(settings.enabled).toBe(false);
    });
  });

  describe('Export/Import', () => {
    it('should export data', async () => {
      const exportData = await service.exportData(testUser.id);
      expect(exportData).toHaveProperty('exportedAt');
      expect(exportData).toHaveProperty('appVersion');
      expect(exportData).toHaveProperty('data');
    });

    it('should import data with dryRun', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          tasks: [{
            id: 'test-task-1',
            userId: testUser.id,
            title: 'Test Task',
            completed: 0,
            priority: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
        },
      };

      const result = await service.importData(testUser.id, payload, true);
      expect(result.dryRun).toBe(true);
      expect(result.result.tasks.imported).toBe(1);
    });

    it('should import data for real', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          tasks: [{
            id: 'test-task-2',
            userId: testUser.id,
            title: 'Test Task',
            completed: 0,
            priority: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
        },
      };

      const result = await service.importData(testUser.id, payload, false);
      expect(result.dryRun).toBe(false);
      expect(result.result.tasks.imported).toBe(1);
    });

    it('should validate import payload', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          user_profiles: [{
            userId: testUser.id,
            name: 'Test',
            email: 'test@test.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          tasks: [{
            id: 'test-task-3',
            userId: testUser.id,
            title: 'Test Task',
            completed: 0,
            priority: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
        },
      };

      const result = await service.importData(testUser.id, payload, false);
      expect(result.result.user_profiles.skipped).toBe(1);
      expect(result.result.tasks.imported).toBe(1);
    });

    it('should reject major version mismatch', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '2.0.0',
        data: {},
      };

      await expect(service.importData(testUser.id, payload, false))
        .rejects.toThrow('Major version mismatch');
    });

    it('should warn on minor version mismatch', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.1.0',
        data: {},
      };

      const result = await service.importData(testUser.id, payload, true);
      expect(result.warnings).toContainEqual(expect.stringContaining('Minor version difference'));
    });

    it('should validate import without importing', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          tasks: [{
            id: 'test-task-4',
            userId: testUser.id,
            title: 'Test Task',
            completed: 0,
            priority: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
        },
      };

      const result = await service.validateImport(payload);
      expect(result.valid).toBe(true);
      expect(result.tableCounts.tasks).toBe(1);
    });

    it('should reject invalid payload format', async () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: 'not-an-object',
      };

      const result = await service.validateImport(payload);
      expect(result.valid).toBe(false);
    });
  });
});