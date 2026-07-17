import { Test } from '@nestjs/testing';
import { PlannerService } from '../../../../src/modules/planner/planner.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';
import { ActivityTrackerService } from '../../../../src/modules/activity-tracker/activity-tracker.service';
import { AchievementsEventGateway } from '../../../../src/modules/achievements/achievements.gateway';
import { schema } from '../../../../src/drizzle';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

function createMockDb() {
  const _returning = jest.fn().mockResolvedValue([{ id: 'mock-id' }]);
  const _execute = jest.fn().mockResolvedValue({ changes: 1 });
  const _selectWhere = jest.fn().mockResolvedValue([]);

  const chain: any = {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({ returning: _returning })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({ where: jest.fn(() => ({ returning: _returning, execute: _execute })) })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({ returning: _returning, execute: _execute })),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => _selectWhere),
        orderBy: jest.fn(() => _selectWhere),
        leftJoin: jest.fn(() => ({ where: jest.fn(() => _selectWhere) })),
      })),
    })),
    query: {
      plannerEvents: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    },
    _returning, _execute, _selectWhere,
  };
  return chain;
}

const mockActivityTracker = { start: jest.fn().mockResolvedValue({ id: 'session-1' }) };
const mockAchievementsGateway = { onEventCompleted: jest.fn() };

jest.mock('../../../../src/modules/activity-tracker/activity-tracker.service', () => ({
  ActivityTrackerService: jest.fn().mockImplementation(() => mockActivityTracker),
}));
jest.mock('../../../../src/modules/achievements/achievements.gateway', () => ({
  AchievementsEventGateway: jest.fn().mockImplementation(() => mockAchievementsGateway),
}));

describe('PlannerService', () => {
  let service: PlannerService;
  let db: ReturnType<typeof createMockDb>;
  const userId = 'user-1';

  beforeEach(async () => {
    db = createMockDb();
    jest.clearAllMocks();
    mockActivityTracker.start.mockResolvedValue({ id: 'session-1' });

    const module = await Test.createTestingModule({
      providers: [
        PlannerService,
        ActivityTrackerService,
        AchievementsEventGateway,
        { provide: DRIZZLE, useValue: db },
      ],
    }).compile();
    service = module.get(PlannerService);
  });

  describe('listByDate', () => {
    it('should return events for a date', async () => {
      db.query.plannerEvents.findMany.mockResolvedValue([{ id: 'e1', title: 'Standup', date: '2026-07-17' }]);
      const result = await service.listByDate(userId, '2026-07-17');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Standup');
    });

    it('should return empty array on no events', async () => {
      db.query.plannerEvents.findMany.mockResolvedValue([]);
      const result = await service.listByDate(userId, '2026-07-17');
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a planner event', async () => {
      const result = await service.create(userId, { title: 'Meeting', date: '2026-07-17', startTime: '09:00', endTime: '10:00', durationMinutes: 60 });
      expect(db.insert).toHaveBeenCalledWith(schema.plannerEvents);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update an existing event', async () => {
      db.query.plannerEvents.findFirst = jest.fn().mockResolvedValue({ id: 'e1', userId });
      db._returning.mockResolvedValue([{ id: 'e1', title: 'Updated' }]);
      const result = await service.update('e1', userId, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should return updated event object if not found on update', async () => {
      db.query.plannerEvents.findFirst = jest.fn().mockResolvedValue(null);
      db._returning.mockResolvedValue([{ id: 'mock-id' }]);
      const result = await service.update('bad', userId, { title: 'X' });
      expect(result).toEqual({ id: 'mock-id' });
    });
  });

  describe('delete', () => {
    it('should delete an event', async () => {
      db.query.plannerEvents.findFirst = jest.fn().mockResolvedValue({ id: 'e1', userId });
      db._returning.mockResolvedValue([{ id: 'e1' }]);
      const result = await service.delete('e1', userId);
      expect(db.delete).toHaveBeenCalledWith(schema.plannerEvents);
      expect(result).toEqual([{ id: 'e1' }]);
    });

    it('should return array with result if event not found on delete', async () => {
      db.query.plannerEvents.findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.delete('bad', userId);
      expect(result).toEqual([{ id: 'mock-id' }]);
    });
  });

  describe('startEvent', () => {
    it('should start event and create session', async () => {
      db.query.plannerEvents.findFirst = jest.fn()
        .mockResolvedValueOnce({ id: 'e1', title: 'Focus', category: 'work', userId, status: 'scheduled' })
        .mockResolvedValueOnce({ id: 'e1', title: 'Focus', status: 'in_progress', realizedSessionId: 'session-1' });
      const result = await service.startEvent('e1', userId);
      expect(mockActivityTracker.start).toHaveBeenCalledWith(userId, {
        activityName: 'Focus', category: 'work', sourceEventId: 'e1',
      });
      expect(result!.event!.status).toBe('in_progress');
    });

    it('should throw if event not found', async () => {
      db.query.plannerEvents.findFirst = jest.fn().mockResolvedValue(null);
      await expect(service.startEvent('bad', userId)).rejects.toThrow('Planner event not found');
    });
  });
});
