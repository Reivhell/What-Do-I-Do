import { Test } from '@nestjs/testing';
import { HabitsService } from '../../../../src/modules/habits/habits.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';
import { StatisticsService } from '../../../../src/modules/statistics/statistics.service';
import { PlannerService } from '../../../../src/modules/planner/planner.service';
import { AchievementsEventGateway } from '../../../../src/modules/achievements/achievements.gateway';
import { schema } from '../../../../src/drizzle';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
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

describe('HabitsService', () => {
  let service: HabitsService;
  let db: ReturnType<typeof createMockDb>;
  let mockStatsService: { invalidate: jest.Mock };
  let mockPlannerService: { create: jest.Mock };
  let mockAchievementsGateway: { onStreakUpdated: jest.Mock };

  const userId = 'user-1';

  beforeAll(async () => {
    mockStatsService = { invalidate: jest.fn().mockResolvedValue(undefined) };
    mockPlannerService = { create: jest.fn().mockResolvedValue({ id: 'event-id' }) };
    mockAchievementsGateway = { onStreakUpdated: jest.fn().mockResolvedValue([]) };

    const module = await Test.createTestingModule({
      providers: [
        HabitsService,
        { provide: DRIZZLE, useValue: createMockDb() },
        { provide: StatisticsService, useValue: mockStatsService },
        { provide: PlannerService, useValue: mockPlannerService },
        { provide: AchievementsEventGateway, useValue: mockAchievementsGateway },
      ],
    }).compile();

    service = module.get(HabitsService);
    db = module.get(DRIZZLE);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db._returning.mockResolvedValue([{ id: 'mock-id' }]);
    db._selectWhere.mockResolvedValue([]);
  });

  describe('create', () => {
    it('should insert a habit and invalidate statistics', async () => {
      const dto = {
        name: 'Morning Run',
        targetFrequency: 'daily' as const,
        repeatRule: { freq: 'daily' as const, interval: 1 },
      };
      const createdHabit = {
        id: 'mock-id',
        name: 'Morning Run',
        targetFrequency: 'daily',
        currentStreak: 0,
        bestStreak: 0,
        completionCount: 0,
        missedCount: 0,
        notes: null,
        linkedGoalId: null,
      };
      db._returning.mockResolvedValue([createdHabit]);

      const result = await service.create(userId, dto);

      expect(db.insert).toHaveBeenCalledWith(schema.habits);
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'habit');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
      expect(result.name).toBe('Morning Run');
      expect(result.targetFrequency).toBe('daily');
    });
  });

  describe('findAll', () => {
    it('should return all habits for a user', async () => {
      const habits = [
        { id: 'h1', name: 'Read', userId, currentStreak: 0, bestStreak: 0, completionCount: 0, missedCount: 0, notes: null, linkedGoalId: null },
        { id: 'h2', name: 'Meditate', userId, currentStreak: 0, bestStreak: 0, completionCount: 0, missedCount: 0, notes: null, linkedGoalId: null },
      ];
      db.query.habits.findMany.mockResolvedValue(habits);

      const result = await service.findAll(userId);

      expect(db.query.habits.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no habits exist', async () => {
      db.query.habits.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('logHabit', () => {
    const habitId = 'habit-1';
    const existingHabit = {
      id: habitId,
      name: 'Read',
      userId,
      currentStreak: 0,
      bestStreak: 0,
      completionCount: 0,
      missedCount: 0,
      notes: null,
      linkedGoalId: null,
    };

    it('should upsert a habit log and recompute streaks', async () => {
      db.query.habits.findFirst.mockResolvedValue(existingHabit);
      const newLog = { id: 'log-1', habitId, date: '2026-07-16', status: 'done', linkedEventId: null, linkedSessionId: null };
      db._returning.mockResolvedValue([newLog]);
      const allLogs = [
        { id: 'log-1', habitId, date: '2026-07-16', status: 'done' as const },
        { id: 'log-2', habitId, date: '2026-07-15', status: 'done' as const },
        { id: 'log-3', habitId, date: '2026-07-14', status: 'done' as const },
      ];
      db.query.habitLogs.findMany.mockResolvedValue(allLogs);

      const dto = { date: '2026-07-16', status: 'done' as const };
      const result = await service.logHabit(habitId, userId, dto);

      expect(db.insert).toHaveBeenCalledWith(schema.habitLogs);
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'habit');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
      expect(mockAchievementsGateway.onStreakUpdated).toHaveBeenCalledWith(userId, expect.any(Number), expect.any(Number));
      expect(result.date).toBe('2026-07-16');
      expect(result.status).toBe('done');
    });

    it('should throw NotFoundException if habit does not exist', async () => {
      db.query.habits.findFirst.mockResolvedValue(null);

      const dto = { date: '2026-07-16', status: 'done' as const };
      await expect(service.logHabit(habitId, userId, dto)).rejects.toThrow('Habit not found');
    });
  });
});
