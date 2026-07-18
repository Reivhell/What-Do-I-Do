import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LifeLogService } from '../../../../src/modules/life-log/life-log.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

function createMockDb() {
  const chain = {
    select: jest.fn(() => chain),
    from: jest.fn(() => chain),
    where: jest.fn(() => chain),
    innerJoin: jest.fn(() => chain),
    leftJoin: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    groupBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    offset: jest.fn(() => chain),
    then: jest.fn((resolve: any) => resolve([{ count: 0 }])),
    catch: jest.fn(),
    [Symbol.iterator]: () => [{ count: 0 }][Symbol.iterator](),
  };

  return {
    all: jest.fn().mockResolvedValue([]),
    select: jest.fn(() => chain),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() =>
          Promise.resolve([{ id: 'mock-annotation-id', title: 'Test Note', userId: 'user-1' }]),
        ),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() =>
            Promise.resolve([{ id: 'mock-annotation-id', title: 'Updated', userId: 'user-1' }]),
          ),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve()),
    })),
    query: {
      lifeLogAnnotations: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    },
  };
}

const mockDb = createMockDb();

describe('LifeLogService', () => {
  let service: LifeLogService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LifeLogService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(LifeLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTimeline', () => {
    it('should return timeline entries from raw SQL query', async () => {
      const mockEntries = [
        { source: 'activity', id: '1', title: 'Morning run', userId: 'user-1', timestamp: '2024-01-15T08:00:00' },
        { source: 'planner', id: '2', title: 'Team meeting', userId: 'user-1', timestamp: '2024-01-15T10:00:00' },
      ];
      mockDb.all.mockResolvedValueOnce(mockEntries);

      const result = await service.getTimeline('user-1');

      expect(result).toEqual(mockEntries);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary with all count fields', async () => {
      const result = await service.getDailySummary('user-1', '2024-01-15');

      expect(result).toEqual({
        date: '2024-01-15',
        totalActivities: 0,
        totalPlannerEvents: 0,
        totalTransactions: 0,
        totalHabitLogs: 0,
        totalAnnotations: 0,
        total: 0,
      });
    });

    it('should make 5 separate select queries', async () => {
      mockDb.select.mockClear();
      await service.getDailySummary('user-1', '2024-01-15');

      // Called once per source (activities, planner, transactions, habits, annotations)
      expect(mockDb.select).toHaveBeenCalledTimes(5);
    });
  });

  describe('createAnnotation', () => {
    it('should create and return an annotation', async () => {
      const dto = {
        timestamp: '2024-01-15T12:00:00',
        title: 'Test Note',
        description: 'A test description',
        note: 'A note',
      };

      const result = await service.createAnnotation('user-1', dto);

      expect(result).toEqual({ id: 'mock-annotation-id', title: 'Test Note', userId: 'user-1' });
    });
  });

  describe('findAllAnnotations', () => {
    it('should return all annotations for user', async () => {
      const mockAnnotations = [
        { id: 'ann-1', title: 'Note 1', userId: 'user-1' },
        { id: 'ann-2', title: 'Note 2', userId: 'user-1' },
      ];
      mockDb.query.lifeLogAnnotations.findMany.mockResolvedValueOnce(mockAnnotations);

      const result = await service.findAllAnnotations('user-1');

      expect(result).toEqual(mockAnnotations);
    });

    it('should filter annotations by date', async () => {
      mockDb.query.lifeLogAnnotations.findMany.mockResolvedValueOnce([]);

      const result = await service.findAllAnnotations('user-1', '2024-01-15');

      expect(result).toEqual([]);
    });
  });

  describe('findAnnotation', () => {
    it('should return annotation when found', async () => {
      const mockAnnotation = { id: 'ann-1', title: 'My Note', userId: 'user-1' };
      mockDb.query.lifeLogAnnotations.findFirst = jest.fn().mockResolvedValue(mockAnnotation);

      const result = await service.findAnnotation('ann-1', 'user-1');

      expect(result).toEqual(mockAnnotation);
    });

    it('should throw NotFoundException when annotation is not found', async () => {
      mockDb.query.lifeLogAnnotations.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.findAnnotation('ann-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAnnotation', () => {
    it('should update and return the annotation', async () => {
      mockDb.query.lifeLogAnnotations.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'ann-1', userId: 'user-1', title: 'Old Title' });

      const dto = { title: 'Updated Title' };
      const result = await service.updateAnnotation('ann-1', 'user-1', dto);

      expect(result).toEqual({ id: 'mock-annotation-id', title: 'Updated', userId: 'user-1' });
    });
  });

  describe('deleteAnnotation', () => {
    it('should delete the annotation', async () => {
      mockDb.query.lifeLogAnnotations.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'ann-1', userId: 'user-1' });

      await expect(service.deleteAnnotation('ann-1', 'user-1')).resolves.toBeUndefined();
    });
  });
});
