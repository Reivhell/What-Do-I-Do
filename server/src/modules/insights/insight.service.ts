import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema, DbInstance } from '../../drizzle';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

export type InsightType = 'time' | 'habit' | 'productivity' | 'money' | 'task' | 'goal';
export type InsightSeverity = 'info' | 'warning' | 'risk';

interface InsertInsight {
  userId: string;
  type: InsightType;
  message: string;
  severity: InsightSeverity;
  sourceMetric: string | null;
  generatedAt: string;
}

@Injectable()
export class InsightService {
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}

  async generateForUser(userId: string): Promise<void> {
    const [daily, weekly] = await Promise.all([
      this.db.query.analyticsSnapshots.findFirst({
        where: and(
          eq(schema.analyticsSnapshots.userId, userId),
          eq(schema.analyticsSnapshots.periodType, 'daily'),
        ),
        orderBy: desc(schema.analyticsSnapshots.periodStart),
      }),
      this.db.query.analyticsSnapshots.findFirst({
        where: and(
          eq(schema.analyticsSnapshots.userId, userId),
          eq(schema.analyticsSnapshots.periodType, 'weekly'),
        ),
        orderBy: desc(schema.analyticsSnapshots.periodStart),
      }),
    ]);

    const insights: InsertInsight[] = [];
    const now = new Date().toISOString();

    // Rule: Productivity pattern — from daily focusScore + timeDistribution
    if (daily && daily.focusScore !== null && daily.focusScore !== undefined && daily.timeDistribution) {
      const dist = daily.timeDistribution as Record<string, number>;
      const productive = dist.productive ?? 0;
      const total = Object.values(dist).reduce((a, b) => a + b, 0);
      if (productive > 0 && total > 0 && daily.focusScore >= 60) {
        insights.push(this.makeInsight(userId, 'productivity',
          'Kamu paling produktif jam 08.00-11.00', 'info', daily.id, now));
      }
    }

    // Rule: Spending warning — from weekly timeDistribution leisure vs productive
    if (weekly && weekly.timeDistribution) {
      const dist = weekly.timeDistribution as Record<string, number>;
      const leisure = dist.leisure ?? 0;
      const productive = dist.productive ?? 0;
      if (leisure > productive * 1.5) {
        insights.push(this.makeInsight(userId, 'money',
          'Pengeluaran hiburan naik minggu ini', 'warning', weekly.id, now));
      }
    }

    // Rule: Habit failure pattern — placeholder (needs habit completion rate from Analytics)
    if (weekly && weekly.timeDistribution) {
      const dist = weekly.timeDistribution as Record<string, number>;
      const sleep = dist.sleep ?? 0;
      if (sleep > 0 && sleep < 6 * 60) { // less than 6 hours sleep
        insights.push(this.makeInsight(userId, 'habit',
          'Tidur terlalu larut membuat produktivitas turun', 'risk', weekly.id, now));
      }
    }

    // Rule: Schedule density — from daily timeDistribution
    if (daily && daily.timeDistribution) {
      const dist = daily.timeDistribution as Record<string, number>;
      const total = Object.values(dist).reduce((a, b) => a + b, 0);
      if (total > 14 * 60) { // more than 14 hours scheduled
        insights.push(this.makeInsight(userId, 'time',
          'Jadwal malam terlalu padat', 'warning', daily.id, now));
      }
    }

    // Rule: Weekly behavior summary
    if (weekly) {
      const parts: string[] = [];
      if (weekly.disciplineScore !== null && weekly.disciplineScore >= 70) parts.push('disiplin tinggi');
      if (weekly.focusScore !== null && weekly.focusScore >= 70) parts.push('fokus bagus');
      if (weekly.consistencyScore !== null && weekly.consistencyScore >= 70) parts.push('konsisten');
      if (parts.length) {
        insights.push(this.makeInsight(userId, 'productivity',
          `Minggu ini kamu ${parts.join(', ')}`, 'info', weekly.id, now));
      }
    }

    // Rule: Next action recommendation — based on lowest score
    if (daily) {
      const scores = [
        { name: 'disiplin', val: daily.disciplineScore ?? 0 },
        { name: 'fokus', val: daily.focusScore ?? 0 },
        { name: 'konsistensi', val: daily.consistencyScore ?? 0 },
      ].filter(s => s.val !== null);
      if (scores.length) {
        const lowest = scores.reduce((a, b) => a.val < b.val ? a : b);
        if (lowest.val < 50) {
          insights.push(this.makeInsight(userId, 'task',
            `Perbaiki ${lowest.name} hari ini untuk hasil lebih baik`, 'info', daily.id, now));
        }
      }
    }

    if (insights.length) {
      await this.db.insert(schema.insights).values(insights);
    }
  }

  private makeInsight(
    userId: string,
    type: InsightType,
    message: string,
    severity: InsightSeverity,
    sourceMetric: string | null,
    generatedAt: string,
  ): InsertInsight {
    return { userId, type, message, severity, sourceMetric, generatedAt };
  }

  async getActive(userId: string, type?: InsightType, limit = 5) {
    const conditions = [
      eq(schema.insights.userId, userId),
      eq(schema.insights.dismissed, false),
    ];
    if (type) conditions.push(eq(schema.insights.type, type));

    return this.db.query.insights.findMany({
      where: (i, { and }) => and(...conditions),
      orderBy: desc(schema.insights.generatedAt),
      limit,
    });
  }

  async dismiss(id: string, userId: string) {
    await this.db.update(schema.insights)
      .set({ dismissed: true })
      .where(and(eq(schema.insights.id, id), eq(schema.insights.userId, userId)));
  }

  async getWeeklySummary(userId: string) {
    const insights = await this.getActive(userId, undefined, 20);
    const byType: Record<InsightType, typeof insights[0] | null> = {
      time: null, habit: null, productivity: null, money: null, task: null, goal: null,
    };
    for (const insight of insights) {
      if (!byType[insight.type]) byType[insight.type] = insight;
    }
    const topInsight = insights[0] ?? null;
    return { byType, topInsight, generatedAt: new Date().toISOString() };
  }
}