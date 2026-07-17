import { Test } from '@nestjs/testing';
import { StatisticsService } from '../../../../src/modules/statistics/statistics.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

function createMockDb() {
  const chain = {
    select: jest.fn(() => chain),
    from: jest.fn(() => chain),
    where: jest.fn(() => chain),
    innerJoin: jest.fn(() => chain),
    leftJoin: jest.fn(() => chain),
    groupBy: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    offset: jest.fn(() => chain),
    then: jest.fn((resolve) => resolve([{ total: 0, cnt: 0, completed: 0, income: 0, expense: 0, minutes: 0, sessions: 0, count: 0 }])),
    catch: jest.fn(),
    [Symbol.iterator]: () => [{ total: 0, cnt: 0, completed: 0, income: 0, expense: 0, minutes: 0, sessions: 0, count: 0 }][Symbol.iterator](),
  };

  return {
    select: jest.fn(() => chain),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ id: 'mock-id' }])),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({ execute: jest.fn().mockResolvedValue({ changes: 1 }) })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ id: 'mock-id' }])),
          execute: jest.fn(() => Promise.resolve({ changes: 1 })),
        })),
      })),
    })),
    query: {
      statisticsCache: { findFirst: jest.fn().mockResolvedValue(null) },
      tasks: { findMany: jest.fn().mockResolvedValue([]) },
      subtasks: { findMany: jest.fn().mockResolvedValue([]) },
      plannerEvents: { findMany: jest.fn().mockResolvedValue([]) },
      activitySessions: { findMany: jest.fn().mockResolvedValue([]) },
      habits: { findMany: jest.fn().mockResolvedValue([]) },
      habitLogs: { findMany: jest.fn().mockResolvedValue([]) },
      goals: { findMany: jest.fn().mockResolvedValue([]) },
      milestones: { findMany: jest.fn().mockResolvedValue([]) },
      transactions: { findMany: jest.fn().mockResolvedValue([]) },
      accounts: { findMany: jest.fn().mockResolvedValue([]) },
      recurringBills: { findMany: jest.fn().mockResolvedValue([]) },
    },
  };
}

const mockDb = createMockDb();

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [StatisticsService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invalidate', () => {
    it('should delete cache entries for user', async () => {
      await service.invalidate('user-1');
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should delete cache entries for specific scope', async () => {
      await service.invalidate('user-1', 'habit');
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('getOverall', () => {
    it('should return cached stats when fresh', async () => {
      mockDb.query.statisticsCache.findFirst.mockResolvedValueOnce({
        userId: 'user-1',
        scope: 'overall',
        data: JSON.stringify({ totalTasks: 5, completedTasks: 3, totalHabits: 0, totalGoals: 0, totalIncome: 0, totalExpense: 0, totalMinutes: 0, totalSessions: 0, completedToday: 0 }),
        computedAt: new Date().toISOString(),
      });
      const result = await service.getOverall('user-1');
      expect(result.totalTasks).toBe(5);
    });
  });

  describe('getAll', () => {
    it('should return all stat categories without throwing', async () => {
      mockDb.query.statisticsCache.findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.getAll('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('getTime', () => {
    it('should return time stats without throwing', async () => {
      mockDb.query.statisticsCache.findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.getTime('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('getActivity', () => {
    it('should return activity stats without throwing', async () => {
      mockDb.query.statisticsCache.findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.getActivity('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('getMoney', () => {
    it('should return money stats without throwing', async () => {
      mockDb.query.statisticsCache.findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.getMoney('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('getHabit', () => {
    it('should return habit stats without throwing', async () => {
      mockDb.query.statisticsCache.findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.getHabit('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('getGoal', () => {
    it('should return goal stats without throwing', async () => {
      mockDb.query.statisticsCache.findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.getGoal('user-1');
      expect(result).toBeDefined();
    });
  });
});