import { Test } from '@nestjs/testing';
import { InsightService } from '../../../../src/modules/insights/insight.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

function createMockDb() {
  const insertValues = jest.fn().mockResolvedValue(undefined);
  const updateWhere = jest.fn().mockResolvedValue(undefined);
  const updateSet = jest.fn(() => ({ where: updateWhere }));

  return {
    insert: jest.fn(() => ({ values: insertValues })),
    update: jest.fn(() => ({ set: updateSet })),
    query: {
      analyticsSnapshots: { findFirst: jest.fn().mockResolvedValue(null) },
      insights: { findMany: jest.fn().mockResolvedValue([]) },
    },
    _insertValues: insertValues,
    _updateSet: updateSet,
    _updateWhere: updateWhere,
  };
}

const mockDb = createMockDb();

describe('InsightService', () => {
  let service: InsightService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [InsightService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(InsightService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateForUser', () => {
    const dailySnapshot = {
      id: 'snap-daily',
      userId: 'user-1',
      periodType: 'daily',
      focusScore: 75,
      disciplineScore: 80,
      consistencyScore: 70,
      timeDistribution: { productive: 300, leisure: 60, sleep: 480, other: 120 },
      periodStart: '2026-07-18',
      generatedAt: '2026-07-18T00:00:00.000Z',
    };

    const weeklySnapshot = {
      id: 'snap-weekly',
      userId: 'user-1',
      periodType: 'weekly',
      focusScore: 80,
      disciplineScore: 80,
      consistencyScore: 70,
      timeDistribution: { productive: 300, leisure: 60, sleep: 480, other: 120 },
      periodStart: '2026-07-13',
      generatedAt: '2026-07-18T00:00:00.000Z',
    };

    it('should generate insights from daily and weekly analytics', async () => {
      mockDb.query.analyticsSnapshots.findFirst
        .mockResolvedValueOnce(dailySnapshot)
        .mockResolvedValueOnce(weeklySnapshot);

      await service.generateForUser('user-1');

      expect(mockDb.query.analyticsSnapshots.findFirst).toHaveBeenCalledTimes(2);
      expect(mockDb._insertValues).toHaveBeenCalled();
      const insights = mockDb._insertValues.mock.calls[0][0];
      expect(insights).toHaveLength(3);
      expect(insights[0]).toMatchObject({
        userId: 'user-1', type: 'productivity', severity: 'info', sourceMetric: 'snap-daily',
      });
      expect(insights[1]).toMatchObject({
        userId: 'user-1', type: 'time', severity: 'warning', sourceMetric: 'snap-daily',
      });
      expect(insights[2]).toMatchObject({
        userId: 'user-1', type: 'productivity', severity: 'info', sourceMetric: 'snap-weekly',
      });
    });

    it('should not insert insights when no analytics snapshots exist', async () => {
      mockDb.query.analyticsSnapshots.findFirst.mockResolvedValue(null);

      await service.generateForUser('user-1');

      expect(mockDb.query.analyticsSnapshots.findFirst).toHaveBeenCalledTimes(2);
      expect(mockDb._insertValues).not.toHaveBeenCalled();
    });
  });

  describe('getActive', () => {
    const mockInsights = [
      {
        id: 'insight-1', userId: 'user-1', type: 'productivity',
        message: 'Test insight', severity: 'info', sourceMetric: null,
        generatedAt: '2026-07-18T00:00:00.000Z', dismissed: false,
      },
    ];

    it('should return active insights with default limit', async () => {
      mockDb.query.insights.findMany.mockResolvedValue(mockInsights);

      const result = await service.getActive('user-1');

      expect(mockDb.query.insights.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 }),
      );
      expect(result).toEqual(mockInsights);
    });

    it('should filter by insight type', async () => {
      mockDb.query.insights.findMany.mockResolvedValue(mockInsights);

      await service.getActive('user-1', 'productivity');

      expect(mockDb.query.insights.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 }),
      );
    });

    it('should respect custom limit', async () => {
      mockDb.query.insights.findMany.mockResolvedValue([]);

      await service.getActive('user-1', undefined, 10);

      expect(mockDb.query.insights.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 }),
      );
    });

    it('should return empty array when no insights exist', async () => {
      mockDb.query.insights.findMany.mockResolvedValue([]);

      const result = await service.getActive('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('dismiss', () => {
    it('should mark insight as dismissed', async () => {
      await service.dismiss('insight-1', 'user-1');

      expect(mockDb._updateSet).toHaveBeenCalledWith({ dismissed: true });
      expect(mockDb._updateWhere).toHaveBeenCalled();
    });
  });

  describe('getWeeklySummary', () => {
    it('should return weekly summary grouped by type', async () => {
      const insights = [
        {
          id: 'i1', userId: 'user-1', type: 'productivity',
          message: 'Top insight', severity: 'info', sourceMetric: null,
          generatedAt: '2026-07-18T00:00:00.000Z', dismissed: false,
        },
        {
          id: 'i2', userId: 'user-1', type: 'time',
          message: 'Time insight', severity: 'warning', sourceMetric: null,
          generatedAt: '2026-07-17T00:00:00.000Z', dismissed: false,
        },
      ];
      mockDb.query.insights.findMany.mockResolvedValue(insights);

      const result = await service.getWeeklySummary('user-1');

      expect(mockDb.query.insights.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 }),
      );
      expect(result.topInsight).toEqual(insights[0]);
      expect(result.byType.productivity).toEqual(insights[0]);
      expect(result.byType.time).toEqual(insights[1]);
      expect(result.generatedAt).toBeDefined();
    });

    it('should handle empty insights array', async () => {
      mockDb.query.insights.findMany.mockResolvedValue([]);

      const result = await service.getWeeklySummary('user-1');

      expect(result.topInsight).toBeNull();
      expect(result.byType).toBeDefined();
      Object.values(result.byType).forEach((v) => expect(v).toBeNull());
      expect(result.generatedAt).toBeDefined();
    });
  });
});
