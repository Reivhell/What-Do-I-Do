import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema, DbInstance } from '../../drizzle';
import { eq, and, isNull, gte, lt, sql, count, sum, avg } from 'drizzle-orm';
import { ScoreCalculator, ScoreInput } from './score-calculator';

/**
 * Generates analytics_snapshots — pre-computed heavy aggregations.
 * Called by AnalyticsScheduler (node-cron) and manually for testing.
 *
 * Per 18-scaling-notes.md §2:
 * - Daily snapshot first, then weekly/monthly/yearly as derived triggers
 * - UPSERT pattern: idempotent, safe on restart
 */
@Injectable()
export class SnapshotService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private scoreCalculator: ScoreCalculator,
  ) {}

  async generateDailySnapshot(userId: string, dateStr?: string): Promise<void> {
    const periodStart = dateStr ?? this.yesterdayDateStr();
    await this.computeAndUpsert(userId, 'daily', periodStart);
  }

  async generateWeeklySnapshot(userId: string, dateStr?: string): Promise<void> {
    const periodStart = dateStr ?? this.mondayDateStr();
    await this.computeAndUpsert(userId, 'weekly', periodStart);
  }

  async generateMonthlySnapshot(userId: string, dateStr?: string): Promise<void> {
    const periodStart = dateStr ?? this.firstOfMonthDateStr();
    await this.computeAndUpsert(userId, 'monthly', periodStart);
  }

  async generateYearlySnapshot(userId: string, dateStr?: string): Promise<void> {
    const periodStart = dateStr ?? `${new Date().getFullYear()}-01-01`;
    await this.computeAndUpsert(userId, 'yearly', periodStart);
  }

  /**
   * Generate all daily snapshots for all users, then trigger derived snapshots
   * if today is the trigger day (Monday for weekly, 1st for monthly, Jan 1 for yearly).
   */
  async generateAllDailyAndDerived(): Promise<{ usersProcessed: number; userIds: string[] }> {
    const users = await this.db.select({ id: schema.users.id }).from(schema.users);
    const userIds = users.map(u => u.id);
    const today = new Date();
    const yesterday = this.yesterdayDateStr();

    for (const user of users) {
      await this.generateDailySnapshot(user.id, yesterday);
    }

    // Trigger derived
    if (today.getDay() === 1) {
      // Monday
      for (const user of users) {
        await this.generateWeeklySnapshot(user.id, this.mondayDateStr());
      }
    }
    if (today.getDate() === 1) {
      for (const user of users) {
        await this.generateMonthlySnapshot(user.id, this.firstOfMonthDateStr());
      }
    }
    if (today.getMonth() === 0 && today.getDate() === 1) {
      for (const user of users) {
        await this.generateYearlySnapshot(user.id, `${today.getFullYear()}-01-01`);
      }
    }

    return { usersProcessed: users.length, userIds };
  }

  // ── Internal ──

  private async computeAndUpsert(userId: string, periodType: string, periodStart: string): Promise<void> {
    const { start, end } = this.periodBounds(periodStart, periodType);

    // Fetch raw aggregation data
    const timeDist = await this.computeTimeDistribution(userId, start, end);
    const scoreInput = await this.computeScoreInput(userId, start, end);
    const scores = this.scoreCalculator.compute(scoreInput);

    // UPSERT — idempotent per (user_id, period_type, period_start)
    await this.db
      .insert(schema.analyticsSnapshots)
      .values({
        userId,
        periodType,
        periodStart,
        disciplineScore: scores.discipline,
        focusScore: scores.focus,
        consistencyScore: scores.consistency,
        timeDistribution: timeDist,
        generatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [schema.analyticsSnapshots.userId, schema.analyticsSnapshots.periodType, schema.analyticsSnapshots.periodStart],
        set: {
          disciplineScore: scores.discipline,
          focusScore: scores.focus,
          consistencyScore: scores.consistency,
          timeDistribution: timeDist,
          generatedAt: new Date().toISOString(),
        },
      });
  }

  private async computeTimeDistribution(userId: string, start: string, end: string): Promise<Record<string, number>> {
    const rows = await this.db
      .select({
        category: schema.activitySessions.category,
        minutes: sql<number>`COALESCE(SUM(${schema.activitySessions.durationMinutes}), 0)`,
      })
      .from(schema.activitySessions)
      .where(and(
        eq(schema.activitySessions.userId, userId),
        gte(schema.activitySessions.createdAt, start),
        lt(schema.activitySessions.createdAt, end),
        isNull(schema.activitySessions.deletedAt),
      ))
      .groupBy(schema.activitySessions.category);

    const dist: Record<string, number> = {};
    for (const r of rows) {
      dist[r.category] = r.minutes;
    }
    return dist;
  }

  private async computeScoreInput(userId: string, start: string, end: string): Promise<ScoreInput> {
    // Planned events in period
    const [planned] = await this.db
      .select({ count: count() })
      .from(schema.plannerEvents)
      .where(and(
        eq(schema.plannerEvents.userId, userId),
        gte(schema.plannerEvents.date, start),
        lt(schema.plannerEvents.date, end),
      ));

    // Events with realized sessions
    const [realized] = await this.db
      .select({ count: count() })
      .from(schema.plannerEvents)
      .where(and(
        eq(schema.plannerEvents.userId, userId),
        gte(schema.plannerEvents.date, start),
        lt(schema.plannerEvents.date, end),
        sql`${schema.plannerEvents.realizedSessionId} IS NOT NULL`,
      ));

    // Session stats
    const [sessionStats] = await this.db
      .select({
        total: count(schema.activitySessions.id),
        avgMinutes: avg(schema.activitySessions.durationMinutes),
      })
      .from(schema.activitySessions)
      .where(and(
        eq(schema.activitySessions.userId, userId),
        gte(schema.activitySessions.createdAt, start),
        lt(schema.activitySessions.createdAt, end),
        isNull(schema.activitySessions.deletedAt),
      ));

    const [longSessions] = await this.db
      .select({ count: count() })
      .from(schema.activitySessions)
      .where(and(
        eq(schema.activitySessions.userId, userId),
        gte(schema.activitySessions.createdAt, start),
        lt(schema.activitySessions.createdAt, end),
        isNull(schema.activitySessions.deletedAt),
        sql`${schema.activitySessions.durationMinutes} > 30`,
      ));

    // Daily breakdown for consistency
    const dailyTotals = await this.db
      .select({
        date: sql`date(${schema.activitySessions.createdAt})`,
        minutes: sql<number>`COALESCE(SUM(${schema.activitySessions.durationMinutes}), 0)`,
      })
      .from(schema.activitySessions)
      .where(and(
        eq(schema.activitySessions.userId, userId),
        gte(schema.activitySessions.createdAt, start),
        lt(schema.activitySessions.createdAt, end),
        isNull(schema.activitySessions.deletedAt),
      ))
      .groupBy(sql`date(${schema.activitySessions.createdAt})`);

    const totalSessions = sessionStats?.total ?? 0;
    const avgDaily = dailyTotals.length > 0
      ? dailyTotals.reduce((a, b) => a + b.minutes, 0) / dailyTotals.length
      : 0;
    const variance = dailyTotals.length > 0
      ? dailyTotals.reduce((sum, d) => sum + Math.pow(d.minutes - avgDaily, 2), 0) / dailyTotals.length
      : 0;
    const stdDaily = Math.sqrt(variance);

    return {
      plannedEvents: planned?.count ?? 0,
      realizedEvents: realized?.count ?? 0,
      totalSessions,
      longSessions: longSessions?.count ?? 0,
      avgDailyMinutes: avgDaily,
      stdDailyMinutes: stdDaily,
    };
  }

  private periodBounds(periodStart: string, periodType: string): { start: string; end: string } {
    const start = new Date(periodStart + 'T00:00:00.000Z');
    const end = new Date(start);

    switch (periodType) {
      case 'daily':
        end.setDate(end.getDate() + 1);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 7);
        break;
      case 'monthly': {
        end.setMonth(end.getMonth() + 1);
        // Handle month-end edge: if start is 31, adding month may skip Feb
        if (end.getDate() !== start.getDate()) {
          end.setDate(0); // last day of previous month
        }
        break;
      }
      case 'yearly':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  private yesterdayDateStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  private mondayDateStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7); // last Monday
    return d.toISOString().split('T')[0];
  }

  private firstOfMonthDateStr(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }
}
