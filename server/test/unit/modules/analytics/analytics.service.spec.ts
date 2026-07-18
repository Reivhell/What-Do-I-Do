import { Test } from '@nestjs/testing';
import { AnalyticsService } from '../../../../src/modules/analytics/analytics.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

function createMockDb() {
  const chain = {
    select: jest.fn(() => chain),
    from: jest.fn(() => chain),
    leftJoin: jest.fn(() => chain),
    where: jest.fn(() => chain),
    groupBy: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    then: jest.fn((resolve) => resolve([])),
    catch: jest.fn(),
  };

  return {
    select: jest.fn(() => chain),
    query: {
      analyticsSnapshots: { findFirst: jest.fn() },
      statisticsCache: { findFirst: jest.fn() },
    },
  };
}

const mockDb = createMockDb();

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getReview', () => {
    it('should return snapshot when found', async () => {
      const snapshot = {
        userId: 'user-1',
        periodType: 'daily',
        periodStart: '2026-07-18',
        disciplineScore: 85,
        focusScore: 90,
        consistencyScore: 75,
        timeDistribution: { work: 120 },
        generatedAt: '2026-07-18T00:00:00.000Z',
      };
      mockDb.query.analyticsSnapshots.findFirst.mockResolvedValueOnce(snapshot);

      const result = await service.getReview('user-1', { period: 'daily', date: '2026-07-18' });

      expect(result).toEqual(snapshot);
    });

    it('should return default object when snapshot not found', async () => {
      mockDb.query.analyticsSnapshots.findFirst.mockResolvedValueOnce(null);

      const result = await service.getReview('user-1', { period: 'daily', date: '2026-07-18' });

      expect(result).toEqual({
        periodType: 'daily',
        periodStart: '2026-07-18',
        disciplineScore: null,
        focusScore: null,
        consistencyScore: null,
        timeDistribution: {},
        generatedAt: null,
      });
    });
  });

  describe('getPlannedVsActual', () => {
    it('should return comparison rows with summary', async () => {
      const rows = [
        { id: '1', title: 'Task 1', date: '2026-07-18', plannedMinutes: 60, actualMinutes: 45, category: 'work' },
        { id: '2', title: 'Task 2', date: '2026-07-17', plannedMinutes: 30, actualMinutes: null, category: 'personal' },
      ];
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve(rows));

      const result = await service.getPlannedVsActual('user-1', { start: '2026-07-01', end: '2026-07-31' });

      expect(result.comparison).toEqual(rows);
      expect(result.summary.totalPlanned).toBe(90);
      expect(result.summary.totalActual).toBe(45);
      expect(result.summary.eventCount).toBe(2);
    });

    it('should return empty summary when no events found', async () => {
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve([]));

      const result = await service.getPlannedVsActual('user-1', { start: '2026-07-01', end: '2026-07-31' });

      expect(result.comparison).toEqual([]);
      expect(result.summary.totalPlanned).toBe(0);
      expect(result.summary.totalActual).toBe(0);
      expect(result.summary.eventCount).toBe(0);
    });
  });

  describe('getTimeDistribution', () => {
    it('should return categories with minutes and count', async () => {
      const rows = [
        { category: 'work', minutes: 120, count: 3 },
        { category: 'personal', minutes: 60, count: 2 },
      ];
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve(rows));

      const result = await service.getTimeDistribution('user-1', { start: '2026-07-01', end: '2026-07-31' });

      expect(result.categories).toEqual(rows);
      expect(result.totalMinutes).toBe(180);
    });

    it('should return zero total when no categories', async () => {
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve([]));

      const result = await service.getTimeDistribution('user-1', { start: '2026-07-01', end: '2026-07-31' });

      expect(result.categories).toEqual([]);
      expect(result.totalMinutes).toBe(0);
    });
  });

  describe('getTrend', () => {
    it('should return mapped snapshots with discipline_score metric', async () => {
      const snapshots = [
        { periodStart: '2026-07-18', periodType: 'daily', disciplineScore: 85, focusScore: 90, consistencyScore: 75 },
        { periodStart: '2026-07-17', periodType: 'daily', disciplineScore: 80, focusScore: 88, consistencyScore: 70 },
      ];
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve(snapshots));

      const result = await service.getTrend('user-1', { metric: 'discipline_score', range: { start: '2026-07-01', end: '2026-07-31' } });

      expect(result).toEqual([
        { periodStart: '2026-07-18', periodType: 'daily', value: 85 },
        { periodStart: '2026-07-17', periodType: 'daily', value: 80 },
      ]);
    });

    it('should return mapped snapshots with focus_score metric', async () => {
      const snapshots = [
        { periodStart: '2026-07-18', periodType: 'daily', disciplineScore: 85, focusScore: 90, consistencyScore: 75 },
      ];
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve(snapshots));

      const result = await service.getTrend('user-1', { metric: 'focus_score', range: { start: '2026-07-01', end: '2026-07-31' } });

      expect(result).toEqual([
        { periodStart: '2026-07-18', periodType: 'daily', value: 90 },
      ]);
    });

    it('should return mapped snapshots with consistency_score metric', async () => {
      const snapshots = [
        { periodStart: '2026-07-18', periodType: 'daily', disciplineScore: 85, focusScore: 90, consistencyScore: 75 },
      ];
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve(snapshots));

      const result = await service.getTrend('user-1', { metric: 'consistency_score', range: { start: '2026-07-01', end: '2026-07-31' } });

      expect(result).toEqual([
        { periodStart: '2026-07-18', periodType: 'daily', value: 75 },
      ]);
    });

    it('should return null value when metric field is missing', async () => {
      const snapshots = [
        { periodStart: '2026-07-18', periodType: 'daily', disciplineScore: null, focusScore: null, consistencyScore: null },
      ];
      const chain = mockDb.select();
      chain.then.mockImplementationOnce((resolve) => resolve(snapshots));

      const result = await service.getTrend('user-1', { metric: 'focus_score', range: { start: '2026-07-01', end: '2026-07-31' } });

      expect(result).toEqual([
        { periodStart: '2026-07-18', periodType: 'daily', value: null },
      ]);
    });
  });

  describe('getExportData', () => {
    it('should return combined scores, distribution, and stats', async () => {
      mockDb.query.analyticsSnapshots.findFirst.mockResolvedValueOnce({
        userId: 'user-1',
        periodType: 'monthly',
        periodStart: '2026-07-18',
        disciplineScore: 85,
        focusScore: 90,
        consistencyScore: 75,
        timeDistribution: { work: 120, personal: 60 },
        generatedAt: '2026-07-18T00:00:00.000Z',
      });
      mockDb.query.statisticsCache.findFirst.mockResolvedValueOnce({
        userId: 'user-1',
        scope: 'overall',
        data: JSON.stringify({ totalTasks: 10, completedTasks: 7 }),
        computedAt: '2026-07-18T00:00:00.000Z',
      });

      const result = await service.getExportData('user-1');

      expect(result.scores).toEqual({ discipline: 85, focus: 90, consistency: 75 });
      expect(result.timeDistribution).toEqual({ work: 120, personal: 60 });
      expect(result.overallStats).toEqual(JSON.stringify({ totalTasks: 10, completedTasks: 7 }));
      expect(result.generatedAt).toBeDefined();
    });

    it('should handle missing snapshot and stats gracefully', async () => {
      mockDb.query.analyticsSnapshots.findFirst.mockResolvedValueOnce(null);
      mockDb.query.statisticsCache.findFirst.mockResolvedValueOnce(null);

      const result = await service.getExportData('user-1');

      expect(result.scores).toEqual({ discipline: null, focus: null, consistency: null });
      expect(result.timeDistribution).toEqual({});
      expect(result.overallStats).toBeNull();
      expect(result.generatedAt).toBeDefined();
    });
  });
});
