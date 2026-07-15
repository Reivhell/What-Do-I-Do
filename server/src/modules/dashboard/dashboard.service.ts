import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema, DbInstance } from '../../drizzle';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { ActivityTrackerService } from '../activity-tracker/activity-tracker.service';
import { PlannerService } from '../planner/planner.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { InsightService } from '../insights/insight.service';
import type {
  DashboardSummary,
  ActiveSession,
  TodayStats,
  UpcomingEvent,
  DashboardScores,
  TopInsight,
  StreakInfo,
} from '@whatdo/shared';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private activityTracker: ActivityTrackerService,
    private plannerService: PlannerService,
    private analyticsService: AnalyticsService,
    private insightService: InsightService,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummary> {
    const today = new Date().toISOString().split('T')[0];

    const [
      activeSession,
      todayTasks,
      todayMinutes,
      todayMoney,
      todayHabits,
      upcomingEvents,
      scores,
      topInsight,
      streak,
    ] = await Promise.all([
      this.activityTracker.getActiveSession(userId),
      this.getTodayTasks(userId, today),
      this.getTodayMinutes(userId, today),
      this.getTodayMoney(userId, today),
      this.getTodayHabits(userId, today),
      this.getUpcomingEvents(userId, today),
      this.getScores(userId),
      this.getTopInsight(userId),
      this.getStreak(userId),
    ]);

    return {
      activeSession: activeSession
        ? {
            isActive: true,
            activityName: activeSession.activityName,
            elapsedSeconds: activeSession.startTime
              ? Math.round((Date.now() - new Date(activeSession.startTime).getTime()) / 1000)
              : undefined,
            sessionId: activeSession.id,
          }
        : null,
      todayStats: {
        tasksCompleted: todayTasks.completed,
        tasksTotal: todayTasks.total,
        minutesTracked: todayMinutes,
        expenseToday: todayMoney.expense,
        incomeToday: todayMoney.income,
        habitsDone: todayHabits.done,
        habitsTotal: todayHabits.total,
      },
      upcomingEvents,
      scores,
      topInsight,
      streak,
    };
  }

  private async getTodayTasks(userId: string, today: string): Promise<{ completed: number; total: number }> {
    const [row] = await this.db
      .select({
        completed: sql<number>`COALESCE(SUM(CASE WHEN ${schema.tasks.status} = 'completed' THEN 1 ELSE 0 END), 0)`,
        total: sql<number>`COUNT(*)`,
      })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.dueDate, today)));
    return { completed: Number(row?.completed ?? 0), total: Number(row?.total ?? 0) };
  }

  private async getTodayMinutes(userId: string, today: string): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.activitySessions.durationMinutes}), 0)`,
      })
      .from(schema.activitySessions)
      .where(
        and(
          eq(schema.activitySessions.userId, userId),
          gte(schema.activitySessions.startTime, `${today}T00:00:00.000Z`),
          lte(schema.activitySessions.startTime, `${today}T23:59:59.999Z`),
        ),
      );
    return Number(row?.total ?? 0);
  }

  private async getTodayMoney(
    userId: string,
    today: string,
  ): Promise<{ income: number; expense: number }> {
    const [row] = await this.db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.type} = 'income' THEN ${schema.transactions.amount} ELSE 0 END), 0)`,
        expense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.type} = 'expense' THEN ${schema.transactions.amount} ELSE 0 END), 0)`,
      })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.userId, userId), eq(schema.transactions.date, today)));
    return { income: Number(row?.income ?? 0), expense: Number(row?.expense ?? 0) };
  }

  private async getTodayHabits(userId: string, today: string): Promise<{ done: number; total: number }> {
    const [row] = await this.db
      .select({
        done: sql<number>`COALESCE(SUM(CASE WHEN ${schema.habitLogs.status} = 'done' THEN 1 ELSE 0 END), 0)`,
        total: sql<number>`COUNT(*)`,
      })
      .from(schema.habitLogs)
      .innerJoin(schema.habits, eq(schema.habitLogs.habitId, schema.habits.id))
      .where(and(eq(schema.habits.userId, userId), eq(schema.habitLogs.date, today)));
    return { done: Number(row?.done ?? 0), total: Number(row?.total ?? 0) };
  }

  private async getUpcomingEvents(userId: string, today: string): Promise<UpcomingEvent[]> {
    const events = await this.db
      .select({
        id: schema.plannerEvents.id,
        title: schema.plannerEvents.title,
        date: schema.plannerEvents.date,
        startTime: schema.plannerEvents.startTime,
        durationMinutes: schema.plannerEvents.durationMinutes,
      })
      .from(schema.plannerEvents)
      .where(
        and(
          eq(schema.plannerEvents.userId, userId),
          gte(schema.plannerEvents.date, today),
          sql`${schema.plannerEvents.status} IN ('scheduled', 'in_progress')`,
        ),
      )
      .orderBy(asc(schema.plannerEvents.date), asc(schema.plannerEvents.startTime))
      .limit(5);

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      time: e.startTime,
      duration: e.durationMinutes ?? undefined,
    }));
  }

  private async getScores(userId: string): Promise<DashboardScores> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const review = await this.analyticsService.getReview(userId, { period: 'weekly', date: today });
      return {
        discipline: review.disciplineScore,
        focus: review.focusScore,
        consistency: review.consistencyScore,
      };
    } catch {
      return { discipline: null, focus: null, consistency: null };
    }
  }

  private async getTopInsight(userId: string): Promise<TopInsight | null> {
    try {
      const summary = await this.insightService.getWeeklySummary(userId);
      if (!summary.topInsight) return null;
      return {
        message: summary.topInsight.message,
        type: summary.topInsight.type,
      };
    } catch {
      return null;
    }
  }

  private async getStreak(userId: string): Promise<StreakInfo> {
    const [row] = await this.db
      .select({
        current: sql<number>`COALESCE(MAX(${schema.habits.currentStreak}), 0)`,
        best: sql<number>`COALESCE(MAX(${schema.habits.bestStreak}), 0)`,
      })
      .from(schema.habits)
      .where(eq(schema.habits.userId, userId));
    return { current: Number(row?.current ?? 0), best: Number(row?.best ?? 0) };
  }
}
