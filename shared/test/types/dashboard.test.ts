import { describe, it, expect } from 'vitest';
import type { DashboardSummary, TodayStats } from '../../src/types/dashboard';

describe('Dashboard types', () => {
  it('should create DashboardSummary', () => {
    const ds: DashboardSummary = {
      habitsCompleted: 5, tasksDue: 3,
      upcomingEvents: [], streakInfo: null,
    };
    expect(ds.habitsCompleted).toBe(5);
  });

  it('should create TodayStats', () => {
    const ts: TodayStats = {
      date: '2026-07-17',
      habitsCompleted: 2, habitsTotal: 4,
      tasksCompleted: 1, tasksTotal: 3,
    };
    expect(ts.habitsCompleted).toBe(2);
    expect(ts.habitsTotal).toBe(4);
  });
});
