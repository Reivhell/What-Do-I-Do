import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema, DbInstance } from '../../drizzle';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export interface ReviewQuery {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string; // YYYY-MM-DD
}

export interface RangeQuery {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface TrendQuery {
  metric: 'discipline_score' | 'focus_score' | 'consistency_score';
  range: { start: string; end: string };
}

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}

  async getReview(userId: string, query: ReviewQuery) {
    const periodStart = query.date;
    const snapshot = await this.db.query.analyticsSnapshots.findFirst({
      where: (s, { eq, and }) => and(
        eq(s.userId, userId),
        eq(s.periodType, query.period),
        eq(s.periodStart, periodStart),
      ),
    });

    return snapshot ?? {
      periodType: query.period,
      periodStart,
      disciplineScore: null,
      focusScore: null,
      consistencyScore: null,
      timeDistribution: {},
      generatedAt: null,
    };
  }

  async getPlannedVsActual(userId: string, range: RangeQuery) {
    const rows = await this.db
      .select({
        id: schema.plannerEvents.id,
        title: schema.plannerEvents.title,
        date: schema.plannerEvents.date,
        plannedMinutes: schema.plannerEvents.durationMinutes,
        actualMinutes: schema.activitySessions.durationMinutes,
        category: schema.plannerEvents.category,
      })
      .from(schema.plannerEvents)
      .leftJoin(schema.activitySessions, eq(schema.plannerEvents.realizedSessionId, schema.activitySessions.id))
      .where(and(
        eq(schema.plannerEvents.userId, userId),
        gte(schema.plannerEvents.date, range.start),
        lte(schema.plannerEvents.date, range.end),
      ))
      .orderBy(desc(schema.plannerEvents.date));

    return {
      comparison: rows,
      summary: {
        totalPlanned: rows.reduce((s, r) => s + (r.plannedMinutes ?? 0), 0),
        totalActual: rows.reduce((s, r) => s + (r.actualMinutes ?? 0), 0),
        eventCount: rows.length,
      },
    };
  }

  async getTimeDistribution(userId: string, range: RangeQuery) {
    const rows = await this.db
      .select({
        category: schema.activitySessions.category,
        minutes: sql<number>`COALESCE(SUM(${schema.activitySessions.durationMinutes}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.activitySessions)
      .where(and(
        eq(schema.activitySessions.userId, userId),
        gte(schema.activitySessions.createdAt, range.start + 'T00:00:00.000Z'),
        lte(schema.activitySessions.createdAt, range.end + 'T23:59:59.999Z'),
        sql`${schema.activitySessions.durationMinutes} IS NOT NULL`,
        sql`${schema.activitySessions.deletedAt} IS NULL`,
      ))
      .groupBy(schema.activitySessions.category)
      .orderBy(sql`COALESCE(SUM(${schema.activitySessions.durationMinutes}), 0) DESC`);

    const totalMinutes = rows.reduce((s, r) => s + r.minutes, 0);

    return {
      categories: rows,
      totalMinutes,
    };
  }

  async getTrend(userId: string, query: TrendQuery) {
    const metricCol = this.metricColumn(query.metric);
    const snapshots = await this.db
      .select()
      .from(schema.analyticsSnapshots)
      .where(and(
        eq(schema.analyticsSnapshots.userId, userId),
        gte(schema.analyticsSnapshots.periodStart, query.range.start),
        lte(schema.analyticsSnapshots.periodStart, query.range.end),
      ))
      .orderBy(desc(schema.analyticsSnapshots.periodStart));

    return snapshots.map((s) => ({
      periodStart: s.periodStart,
      periodType: s.periodType,
      value: s[metricCol] ?? null,
    }));
  }

  async getExportData(userId: string) {
    const [review, stats] = await Promise.all([
      this.getReview(userId, { period: 'monthly', date: new Date().toISOString().split('T')[0] }),
      this.db.query.statisticsCache.findFirst({
        where: (c, { eq, and }) => and(
          eq(c.userId, userId),
          eq(c.scope, 'overall'),
        ),
      }),
    ]);

    return {
      scores: {
        discipline: review.disciplineScore,
        focus: review.focusScore,
        consistency: review.consistencyScore,
      },
      timeDistribution: review.timeDistribution,
      overallStats: stats?.data ?? null,
      generatedAt: new Date().toISOString(),
    };
  }

  private metricColumn(metric: string): 'disciplineScore' | 'focusScore' | 'consistencyScore' {
    const map: Record<string, 'disciplineScore' | 'focusScore' | 'consistencyScore'> = {
      discipline_score: 'disciplineScore',
      focus_score: 'focusScore',
      consistency_score: 'consistencyScore',
    };
    return map[metric] ?? 'disciplineScore';
  }
}
