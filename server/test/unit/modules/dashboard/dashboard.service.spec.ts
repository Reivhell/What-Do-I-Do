import { Test } from '@nestjs/testing';
import { DashboardService } from '../../../../src/modules/dashboard/dashboard.service';
import { ActivityTrackerService } from '../../../../src/modules/activity-tracker/activity-tracker.service';
import { PlannerService } from '../../../../src/modules/planner/planner.service';
import { AnalyticsService } from '../../../../src/modules/analytics/analytics.service';
import { InsightService } from '../../../../src/modules/insights/insight.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

function createMockDb() {
  const defaultRow = {
    completed: 1,
    total: 2,
    income: 100,
    expense: 25,
    done: 0,
    current: 7,
    best: 14,
    id: 'event-1',
    title: 'Team Standup',
    date: '2026-07-18',
    startTime: '09:00',
    durationMinutes: 30,
  };

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
    then: jest.fn((resolve) => resolve([defaultRow])),
    catch: jest.fn(),
    [Symbol.iterator]: () => [defaultRow][Symbol.iterator](),
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
    query: {},
  };
}

const mockDb = createMockDb();

describe('DashboardService', () => {
  let service: DashboardService;

  const mockActivityTracker = { getActiveSession: jest.fn() };
  const mockPlannerService = {};
  const mockAnalyticsService = { getReview: jest.fn() };
  const mockInsightService = { getWeeklySummary: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: ActivityTrackerService, useValue: mockActivityTracker },
        { provide: PlannerService, useValue: mockPlannerService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: InsightService, useValue: mockInsightService },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  describe('getSummary', () => {
    it('should return the expected DashboardSummary shape with full data', async () => {
      mockActivityTracker.getActiveSession.mockResolvedValueOnce({
        id: 'session-1',
        activityName: 'Working',
        startTime: '2026-07-18T08:00:00.000Z',
      });

      mockAnalyticsService.getReview.mockResolvedValueOnce({
        disciplineScore: 85,
        focusScore: 72,
        consistencyScore: 90,
      });

      mockInsightService.getWeeklySummary.mockResolvedValueOnce({
        topInsight: {
          message: 'You are most productive in the morning',
          type: 'productivity',
        },
      });

      const result = await service.getSummary('user-1');

      expect(result).toEqual({
        activeSession: {
          isActive: true,
          activityName: 'Working',
          elapsedSeconds: expect.any(Number),
          sessionId: 'session-1',
        },
        todayStats: {
          tasksCompleted: 1,
          tasksTotal: 2,
          minutesTracked: 2,
          expenseToday: 25,
          incomeToday: 100,
          habitsDone: 0,
          habitsTotal: 2,
        },
        upcomingEvents: [
          {
            id: 'event-1',
            title: 'Team Standup',
            time: '09:00',
            duration: 30,
          },
        ],
        scores: {
          discipline: 85,
          focus: 72,
          consistency: 90,
        },
        topInsight: {
          message: 'You are most productive in the morning',
          type: 'productivity',
        },
        streak: {
          current: 7,
          best: 14,
        },
      });
    });

    it('should return null activeSession when no session is active', async () => {
      mockActivityTracker.getActiveSession.mockResolvedValueOnce(null);
      mockAnalyticsService.getReview.mockResolvedValueOnce({
        disciplineScore: 85,
        focusScore: 72,
        consistencyScore: 90,
      });
      mockInsightService.getWeeklySummary.mockResolvedValueOnce({
        topInsight: { message: 'Keep going', type: 'motivation' },
      });

      const result = await service.getSummary('user-1');

      expect(result.activeSession).toBeNull();
      expect(result.todayStats).toBeDefined();
      expect(result.upcomingEvents).toHaveLength(1);
    });

    it('should handle analyticsService rejection gracefully', async () => {
      mockActivityTracker.getActiveSession.mockResolvedValueOnce(null);
      mockAnalyticsService.getReview.mockRejectedValueOnce(new Error('Service unavailable'));
      mockInsightService.getWeeklySummary.mockResolvedValueOnce({
        topInsight: { message: 'Keep going', type: 'motivation' },
      });

      const result = await service.getSummary('user-1');

      expect(result.scores).toEqual({
        discipline: null,
        focus: null,
        consistency: null,
      });
    });

    it('should handle insightService rejection gracefully', async () => {
      mockActivityTracker.getActiveSession.mockResolvedValueOnce(null);
      mockAnalyticsService.getReview.mockResolvedValueOnce({
        disciplineScore: 85,
        focusScore: 72,
        consistencyScore: 90,
      });
      mockInsightService.getWeeklySummary.mockRejectedValueOnce(
        new Error('Insights not ready'),
      );

      const result = await service.getSummary('user-1');

      expect(result.topInsight).toBeNull();
    });

    it('should return null topInsight when weekly summary has no topInsight', async () => {
      mockActivityTracker.getActiveSession.mockResolvedValueOnce(null);
      mockAnalyticsService.getReview.mockResolvedValueOnce({
        disciplineScore: 85,
        focusScore: 72,
        consistencyScore: 90,
      });
      mockInsightService.getWeeklySummary.mockResolvedValueOnce({ topInsight: null });

      const result = await service.getSummary('user-1');

      expect(result.topInsight).toBeNull();
    });
  });
});
