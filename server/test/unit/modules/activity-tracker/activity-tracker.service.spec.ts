import { Test } from '@nestjs/testing';
import { ActivityTrackerService } from '../../../../src/modules/activity-tracker/activity-tracker.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';
import { StatisticsService } from '../../../../src/modules/statistics/statistics.service';
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

describe('ActivityTrackerService', () => {
  let service: ActivityTrackerService;
  let db: ReturnType<typeof createMockDb>;
  let mockStatsService: { invalidate: jest.Mock };
  let mockAchievementsGateway: { onSessionCompleted: jest.Mock };

  const userId = 'user-1';

  beforeAll(async () => {
    mockStatsService = { invalidate: jest.fn().mockResolvedValue(undefined) };
    mockAchievementsGateway = { onSessionCompleted: jest.fn().mockResolvedValue([]) };

    const module = await Test.createTestingModule({
      providers: [
        ActivityTrackerService,
        { provide: DRIZZLE, useValue: createMockDb() },
        { provide: StatisticsService, useValue: mockStatsService },
        { provide: AchievementsEventGateway, useValue: mockAchievementsGateway },
      ],
    }).compile();

    service = module.get(ActivityTrackerService);
    db = module.get(DRIZZLE);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db._returning.mockResolvedValue([{ id: 'mock-id' }]);
    db._selectWhere.mockResolvedValue([]);
  });

  describe('start', () => {
    it('should insert a new session and invalidate statistics', async () => {
      db.query.activitySessions.findFirst
        .mockResolvedValueOnce(null); // no active session

      const data = { activityName: 'Coding', category: 'work' };
      const newSession = { id: 'session-1', activityName: 'Coding', category: 'work', startTime: expect.any(String), source: 'live' };
      db._returning.mockResolvedValue([newSession]);

      const result = await service.start(userId, data);

      expect(db.insert).toHaveBeenCalledWith(schema.activitySessions);
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'time');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'activity');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
      expect(result.activityName).toBe('Coding');
    });

    it('should auto-stop existing active session before starting new one', async () => {
      const activeSession = { id: 'active-1', userId, startTime: '2026-07-16T10:00:00.000Z', endTime: null };
      db.query.activitySessions.findFirst
        .mockResolvedValueOnce(activeSession) // getActiveSession returns this
        .mockResolvedValueOnce(activeSession); // stop() calls findFirst again
      db._returning
        .mockResolvedValueOnce([{ ...activeSession, endTime: '2026-07-16T11:00:00.000Z', durationMinutes: 60 }]) // stop update
        .mockResolvedValueOnce([{ id: 'session-2', activityName: 'Reading', category: 'personal' }]); // start insert

      const data = { activityName: 'Reading', category: 'personal' };
      const result = await service.start(userId, data);

      expect(db.update).toHaveBeenCalled(); // stop updates the old session
      expect(db.insert).toHaveBeenCalledWith(schema.activitySessions); // start inserts new one
      expect(result.activityName).toBe('Reading');
    });
  });

  describe('stop', () => {
    it('should end a session with duration and invalidate statistics', async () => {
      const sessionId = 'session-1';
      const existingSession = {
        id: sessionId,
        userId,
        startTime: '2026-07-16T10:00:00.000Z',
        endTime: null,
        deletedAt: null,
      };
      db.query.activitySessions.findFirst.mockResolvedValue(existingSession);
      db._returning.mockResolvedValue([{ ...existingSession, endTime: expect.any(String), durationMinutes: 60 }]);
      db._selectWhere
        .mockResolvedValueOnce([{ count: 5 }])  // getTotalSessions
        .mockResolvedValueOnce([{ total: 10 }]); // getTotalHours

      const result = await service.stop(userId, sessionId);

      expect(db.update).toHaveBeenCalled();
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'time');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'activity');
      expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
      expect(mockAchievementsGateway.onSessionCompleted).toHaveBeenCalledWith(userId, 5, 10);
      expect(result.durationMinutes).toBe(60);
    });

    it('should throw NotFoundException if session does not exist', async () => {
      db.query.activitySessions.findFirst.mockResolvedValue(null);

      await expect(service.stop(userId, 'nonexistent')).rejects.toThrow('Session not found');
    });

    it('should throw BadRequestException if session already stopped', async () => {
      const stoppedSession = { id: 's1', userId, endTime: '2026-07-16T11:00:00.000Z' };
      db.query.activitySessions.findFirst.mockResolvedValue(stoppedSession);

      await expect(service.stop(userId, 's1')).rejects.toThrow('Session already stopped');
    });
  });

  describe('list', () => {
    it('should return all non-deleted sessions for a user', async () => {
      const sessions = [
        { id: 's1', activityName: 'Coding', category: 'work', userId, deletedAt: null },
        { id: 's2', activityName: 'Reading', category: 'personal', userId, deletedAt: null },
      ];
      db.query.activitySessions.findMany.mockResolvedValue(sessions);

      const result = await service.list(userId);

      expect(db.query.activitySessions.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no sessions exist', async () => {
      db.query.activitySessions.findMany.mockResolvedValue([]);

      const result = await service.list(userId);

      expect(result).toEqual([]);
    });
  });
});
