import { Test } from '@nestjs/testing';
import { SettingsService } from '../../../../src/modules/settings/settings.service';
<<<<<<< HEAD
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';
import { BackupService } from '../../../../src/common/backup/backup.service';
import { schema } from '../../../../src/drizzle';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

jest.mock('../../../../src/common/backup/backup.service', () => ({
  BackupService: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn(() => ({ backupDir: '/tmp', retentionDays: 14, dbPath: ':memory:' })),
    updateConfig: jest.fn((config) => ({ backupDir: '/tmp', retentionDays: config.retentionDays || 14, dbPath: ':memory:' })),
    backup: jest.fn(() => 'what-do-i-do-test.db'),
  })),
}));

function createMockDb() {
  const returningMock = jest.fn().mockResolvedValue([{ id: 'mock-id' }]);
  const executeMock = jest.fn().mockResolvedValue({ changes: 1 });
  const selectWhereMock = jest.fn().mockResolvedValue([]);

  const chain = {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: returningMock,
        onConflictDoUpdate: jest.fn(() => ({ returning: returningMock })),
        onConflictDoNothing: jest.fn(() => ({ execute: executeMock })),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({ returning: returningMock })),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({ returning: returningMock })),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: selectWhereMock,
      })),
    })),
    query: {
      tasks: { findMany: jest.fn(), findFirst: jest.fn() },
      subtasks: { findMany: jest.fn(), findFirst: jest.fn() },
      habits: { findMany: jest.fn(), findFirst: jest.fn() },
      habitLogs: { findMany: jest.fn(), findFirst: jest.fn() },
      goals: { findMany: jest.fn(), findFirst: jest.fn() },
      milestones: { findMany: jest.fn(), findFirst: jest.fn() },
      plannerEvents: { findMany: jest.fn(), findFirst: jest.fn() },
      activitySessions: { findMany: jest.fn(), findFirst: jest.fn() },
      userProfiles: { findMany: jest.fn(), findFirst: jest.fn() },
      userPreferences: { findMany: jest.fn(), findFirst: jest.fn() },
      notificationSettings: { findMany: jest.fn(), findFirst: jest.fn() },
      categoryDefinitions: { findMany: jest.fn(), findFirst: jest.fn() },
      statisticsCache: { findMany: jest.fn(), findFirst: jest.fn() },
    },
    _returning: returningMock,
    _execute: executeMock,
    _selectWhere: selectWhereMock,
  };

  return chain;
}

describe('SettingsService', () => {
  let service: SettingsService;
  let db: ReturnType<typeof createMockDb>;

  const userId = 'user-1';
=======
import { BackupService } from '../../../../src/common/backup/backup.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

const mockDb = { insert: jest.fn(), select: jest.fn(), query: {} };
const mockBackup = { getConfig: jest.fn(() => ({})), backup: jest.fn() };

describe('SettingsService', () => {
  let service: SettingsService;
>>>>>>> dev

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SettingsService,
<<<<<<< HEAD
        { provide: DRIZZLE, useValue: createMockDb() },
        { provide: BackupService, useValue: { getConfig: jest.fn(), updateConfig: jest.fn(), backup: jest.fn() } },
      ],
    }).compile();

    service = module.get(SettingsService);
    db = module.get(DRIZZLE);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db._returning.mockResolvedValue([{ id: 'mock-id' }]);
    db._selectWhere.mockResolvedValue([]);
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const profile = { userId, name: 'Test User', email: 'test@example.com' };
      db.query.userProfiles.findFirst.mockResolvedValue(profile);

      const result = await service.getProfile(userId);

      expect(db.query.userProfiles.findFirst).toHaveBeenCalled();
      expect(result).toEqual(profile);
    });

    it('should return null when no profile exists', async () => {
      db.query.userProfiles.findFirst.mockResolvedValue(null);

      const result = await service.getProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile fields', async () => {
      const data = { name: 'Updated Name', bio: 'Hello world' };
      const updatedProfile = { userId, name: 'Updated Name', bio: 'Hello world' };
      db._returning.mockResolvedValue([updatedProfile]);

      const result = await service.updateProfile(userId, data);

      expect(db.update).toHaveBeenCalledWith(schema.userProfiles);
      expect(result).toEqual([updatedProfile]);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const prefs = { userId, theme: 'dark', language: 'en' };
      db.query.userPreferences.findFirst.mockResolvedValue(prefs);

      const result = await service.getPreferences(userId);

      expect(db.query.userPreferences.findFirst).toHaveBeenCalled();
      expect(result).toEqual(prefs);
    });
  });

  describe('updatePreferences', () => {
    it('should update preference fields', async () => {
      const data = { theme: 'light', timezone: 'America/New_York' };
      db._returning.mockResolvedValue([{ userId, theme: 'light', timezone: 'America/New_York' }]);

      const result = await service.updatePreferences(userId, data);

      expect(db.update).toHaveBeenCalledWith(schema.userPreferences);
      expect(result).toBeDefined();
    });

    it('should stringify categoryTimeMapping', async () => {
      const data = { categoryTimeMapping: { work: '09:00', personal: '18:00' } };
      db._returning.mockResolvedValue([{ userId, categoryTimeMapping: JSON.stringify(data.categoryTimeMapping) }]);

      await service.updatePreferences(userId, data);

      expect(db.update).toHaveBeenCalledWith(schema.userPreferences);
    });
  });

  describe('getNotifications', () => {
    it('should return notification settings', async () => {
      const settings = { userId, plannerReminderEnabled: true };
      db.query.notificationSettings.findFirst.mockResolvedValue(settings);

      const result = await service.getNotifications(userId);

      expect(db.query.notificationSettings.findFirst).toHaveBeenCalled();
      expect(result).toEqual(settings);
    });
  });

  describe('updateNotifications', () => {
    it('should update notification fields', async () => {
      const data = { plannerReminderEnabled: false, habitReminderEnabled: true };
      db._returning.mockResolvedValue([{ userId, plannerReminderEnabled: false, habitReminderEnabled: true }]);

      const result = await service.updateNotifications(userId, data);

      expect(db.update).toHaveBeenCalledWith(schema.notificationSettings);
      expect(result).toBeDefined();
    });
  });

  describe('getCategories', () => {
    it('should return categories for a user', async () => {
      const categories = [
        { id: 'c1', userId, domain: 'activity', name: 'Work', color: '#ff0000' },
      ];
      db.query.categoryDefinitions.findMany.mockResolvedValue(categories);

      const result = await service.getCategories(userId);

      expect(db.query.categoryDefinitions.findMany).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });

    it('should filter categories by domain', async () => {
      db.query.categoryDefinitions.findMany.mockResolvedValue([]);

      const result = await service.getCategories(userId, 'activity');

      expect(result).toEqual([]);
    });
  });

  describe('createCategory', () => {
    it('should insert a new category', async () => {
      const data = { domain: 'activity', name: 'Fitness', color: '#00ff00' };
      const created = { id: 'cat-1', ...data, userId };
      db._returning.mockResolvedValue([created]);

      const result = await service.createCategory(userId, data);

      expect(db.insert).toHaveBeenCalledWith(schema.categoryDefinitions);
      expect(result.name).toBe('Fitness');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category by id', async () => {
      const categoryId = 'cat-1';
      db._returning.mockResolvedValue([{ id: categoryId }]);

      const result = await service.deleteCategory(categoryId);

      expect(db.delete).toHaveBeenCalledWith(schema.categoryDefinitions);
      expect(result).toEqual([{ id: categoryId }]);
    });
=======
        { provide: DRIZZLE, useValue: mockDb },
        { provide: BackupService, useValue: mockBackup },
      ],
    }).compile();
    service = module.get(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
>>>>>>> dev
  });
});
