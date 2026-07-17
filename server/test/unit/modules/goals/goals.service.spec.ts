import { Test } from '@nestjs/testing';
import { GoalsService } from '../../../../src/modules/goals/goals.service';
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

describe('GoalsService', () => {
  let service: GoalsService;
  let db: ReturnType<typeof createMockDb>;
  let mockStatsService: { invalidate: jest.Mock };
  let mockPlannerService: { create: jest.Mock };
  let mockAchievementsGateway: { onGoalCompleted: jest.Mock };

  const userId = 'user-1';

  beforeAll(async () => {
    mockStatsService = { invalidate: jest.fn().mockResolvedValue(undefined) };
    mockPlannerService = { create: jest.fn().mockResolvedValue({ id: 'planner-event-id' }) };
    mockAchievementsGateway = { onGoalCompleted: jest.fn().mockResolvedValue([]) };

    const module = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: DRIZZLE, useValue: createMockDb() },
        { provide: StatisticsService, useValue: mockStatsService },
        { provide: PlannerService, useValue: mockPlannerService },
        { provide: AchievementsEventGateway, useValue: mockAchievementsGateway },
      ],
    }).compile();

    service = module.get(GoalsService);
    db = module.get(DRIZZLE);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db._returning.mockResolvedValue([{ id: 'mock-id' }]);
    db._selectWhere.mockResolvedValue([]);
  });

  describe('createGoal', () => {
    it('should insert a goal and invalidate statistics', async () => {
      const data = { title: 'Learn TypeScript', description: 'Master advanced types' };
      const createdGoal = {
        id: 'mock-id',
        title: 'Learn TypeScript',
        description: 'Master advanced types',
        status: 'active',
      };
      db._returning.mockResolvedValue([createdGoal]);

      const result = await service.createGoal(userId, data);

      expect(db.insert).toHaveBeenCalledWith(schema.goals);
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'goal');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
      expect(result.title).toBe('Learn TypeScript');
    });

    it('should create a goal without optional fields', async () => {
      const data = { title: 'Minimal Goal' };
      db._returning.mockResolvedValue([{ id: 'mock-id', title: 'Minimal Goal' }]);

      const result = await service.createGoal(userId, data);

      expect(result.title).toBe('Minimal Goal');
    });
  });

  describe('listGoals', () => {
    it('should return all goals for a user', async () => {
      const goals = [
        { id: 'g1', title: 'Goal A', userId, status: 'active' },
        { id: 'g2', title: 'Goal B', userId, status: 'active' },
      ];
      db.query.goals.findMany.mockResolvedValue(goals);

      const result = await service.listGoals(userId);

      expect(db.query.goals.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no goals exist', async () => {
      db.query.goals.findMany.mockResolvedValue([]);

      const result = await service.listGoals(userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateGoal', () => {
    const goalId = 'goal-1';
    const existingGoal = { id: goalId, title: 'Old Title', userId, status: 'active' };

    it('should update goal fields and invalidate statistics', async () => {
      db.query.goals.findFirst.mockResolvedValue(existingGoal);
      const updatedGoal = { ...existingGoal, title: 'New Title', status: 'completed' };
      db._returning.mockResolvedValue([updatedGoal]);

      const result = await service.updateGoal(userId, goalId, { title: 'New Title', status: 'completed' });

      expect(db.query.goals.findFirst).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalledWith(schema.goals);
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'goal');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
      expect(result.title).toBe('New Title');
      expect(result.status).toBe('completed');
    });

    it('should throw NotFoundException if goal does not exist', async () => {
      db.query.goals.findFirst.mockResolvedValue(null);

      await expect(
        service.updateGoal(userId, 'nonexistent', { title: 'Nope' }),
      ).rejects.toThrow('Goal not found');
    });
  });
});
