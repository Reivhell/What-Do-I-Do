import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type {
  OverviewStats,
  TimeStats,
  ActivityStats,
  ActivityStatEntry,
  MoneyStats,
  HabitStats,
  GoalStats,
} from '@whatdo/shared';

const CACHE_TTL_MS = 5 * 60 * 1000;

type Scope = 'overall' | 'time' | 'activity' | 'money' | 'habit' | 'goal';

@Injectable()
export class StatisticsService {
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}

  /* ── Cache layer ── */

  private async getOrCompute<T>(userId: string, scope: Scope, computeFn: () => Promise<T>, forceRefresh = false): Promise<T> {
    if (!forceRefresh) {
      const cached = await this.db.query.statisticsCache.findFirst({
        where: (c, { eq, and }) => and(eq(c.userId, userId), eq(c.scope, scope)),
      });
      if (cached) {
        const age = Date.now() - new Date(cached.computedAt).getTime();
        if (age < CACHE_TTL_MS) {
          return JSON.parse(cached.data) as T;
        }
      }
    }

    const data = await computeFn();

    const now = new Date().toISOString();
    await this.db
      .insert(schema.statisticsCache)
      .values({
        id: randomUUID(),
        userId,
        scope,
        computedAt: now,
        data: JSON.stringify(data),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [schema.statisticsCache.userId, schema.statisticsCache.scope],
        set: { data: JSON.stringify(data), computedAt: now, updatedAt: now },
      });

    return data;
  }

  /* ── Helpers ── */

  private userIdEq() {
    return (t: { userId: string | any }, op: any) => op.eq(t.userId, '');
  }

  private async count(table: any, userId: string, ...extraWhere: any[]) {
    const rows = await this.db
      .select({ cnt: sql<number>`COUNT(*)` })
      .from(table)
      .where(
        and(eq(table.userId, userId), ...extraWhere),
      );
    return rows[0]?.cnt ?? 0;
  }

  private async sum(table: any, column: any, userId: string, ...extraWhere: any[]) {
    const rows = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${column}), 0)` })
      .from(table)
      .where(
        and(eq(table.userId, userId), ...extraWhere),
      );
    return rows[0]?.total ?? 0;
  }

  /* ── Overall ── */

  async computeOverall(userId: string): Promise<OverviewStats> {
    const activitySessions = schema.activitySessions;
    const tasks = schema.tasks;
    const transactions = schema.transactions;
    const habitLogs = schema.habitLogs;
    const goals = schema.goals;
    const milestones = schema.milestones;
    const habits = schema.habits;

    const totalActivitySessions = await this.count(activitySessions, userId, isNull(activitySessions.deletedAt));

    const totalMinutes = await this.sum(
      activitySessions, activitySessions.durationMinutes, userId,
      isNull(activitySessions.deletedAt),
    );
    const totalHoursTrackedFinal = totalMinutes / 60;

    const totalTasks = await this.count(tasks, userId, isNull(tasks.deletedAt));
    const totalCompletedTasks = await this.count(tasks, userId, isNull(tasks.deletedAt), eq(tasks.isCompleted, true));

    const totalTransactions = await this.count(transactions, userId, isNull(transactions.deletedAt));
    const totalIncome = await this.sum(
      transactions, transactions.amount, userId,
      eq(transactions.type, 'income'), isNull(transactions.deletedAt),
    );
    const totalExpense = await this.sum(
      transactions, transactions.amount, userId,
      eq(transactions.type, 'expense'), isNull(transactions.deletedAt),
    );

    const totalHabits = await this.count(habits, userId);
    const totalHabitCompletions = await this.count(
      habitLogs, userId,
      eq(habitLogs.status, 'done'),
    );

    const totalGoals = await this.count(goals, userId);
    const totalCompletedGoals = await this.count(goals, userId, eq(goals.status, 'completed'));

    const totalMilestones = await this.count(milestones, userId);
    const totalCompletedMilestones = await this.count(milestones, userId, eq(milestones.isCompleted, true));

    return {
      totalActivitySessions,
      totalHoursTracked: Math.round(totalHoursTrackedFinal * 100) / 100,
      totalTasks,
      totalCompletedTasks,
      totalTransactions,
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      totalHabits,
      totalHabitCompletions,
      totalGoals,
      totalCompletedGoals,
      totalMilestones,
      totalCompletedMilestones,
    };
  }

  async getOverall(userId: string, forceRefresh = false) {
    return this.getOrCompute(userId, 'overall', () => this.computeOverall(userId), forceRefresh);
  }

  /* ── Time ── */

  async computeTime(userId: string): Promise<TimeStats> {
    const s = schema.activitySessions;
    const baseWhere = and(eq(s.userId, userId), isNull(s.deletedAt));
    const notNullDuration = sql`${s.durationMinutes} IS NOT NULL`;

    // total minutes
    const [totalRow] = await this.db
      .select({ total: sql<number>`COALESCE(SUM(duration_minutes), 0)` })
      .from(s)
      .where(and(baseWhere, notNullDuration));

    // avg minutes
    const [avgRow] = await this.db
      .select({ avg: sql<number>`COALESCE(AVG(duration_minutes), 0)` })
      .from(s)
      .where(and(baseWhere, notNullDuration));

    // max minutes
    const [maxRow] = await this.db
      .select({ max: sql<number>`COALESCE(MAX(duration_minutes), 0)` })
      .from(s)
      .where(and(baseWhere, notNullDuration));

    // sessions per day
    const [dayCount] = await this.db
      .select({
        sessions: sql<number>`COUNT(*)`,
        days: sql<number>`COUNT(DISTINCT DATE(start_time))`,
      })
      .from(s)
      .where(baseWhere);

    const sessionsPerDay = dayCount && dayCount.days > 0
      ? Math.round((dayCount.sessions / dayCount.days) * 100) / 100
      : 0;

    // most active day of week
    const dayRows = await this.db
      .select({
        dow: sql<string>`strftime('%w', start_time)`.as('dow'),
        cnt: sql<number>`COUNT(*)`.as('cnt'),
      })
      .from(s)
      .where(baseWhere)
      .groupBy(sql`strftime('%w', start_time)`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(1);

    const dowMap: Record<string, string> = {
      '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
      '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
    };
    const mostActiveDay = dayRows.length > 0 ? dowMap[dayRows[0].dow] ?? null : null;

    const totalMinutesVal = totalRow?.total ?? 0;

    return {
      totalHoursTracked: Math.round((totalMinutesVal / 60) * 100) / 100,
      averageSessionMinutes: Math.round((avgRow?.avg ?? 0) * 100) / 100,
      longestSessionMinutes: Math.round(maxRow?.max ?? 0),
      sessionsPerDayAverage: sessionsPerDay,
      mostActiveDayOfWeek: mostActiveDay,
    };
  }

  async getTime(userId: string, forceRefresh = false) {
    return this.getOrCompute(userId, 'time', () => this.computeTime(userId), forceRefresh);
  }

  /* ── Activity ── */

  async computeActivity(userId: string): Promise<ActivityStats> {
    const s = schema.activitySessions;
    const baseWhere = and(eq(s.userId, userId), isNull(s.deletedAt));

    const rows = await this.db
      .select({
        activityName: s.activityName,
        category: s.category,
        totalSessions: sql<number>`COUNT(*)`.as('totalSessions'),
        totalMinutes: sql<number>`COALESCE(SUM(duration_minutes), 0)`.as('totalMinutes'),
      })
      .from(s)
      .where(baseWhere)
      .groupBy(s.activityName, s.category)
      .orderBy(desc(sql`COALESCE(SUM(duration_minutes), 0)`));

    const sessionsByActivity: ActivityStatEntry[] = rows.map((r) => ({
      activityName: r.activityName ?? '',
      category: r.category ?? '',
      totalSessions: r.totalSessions ?? 0,
      totalMinutes: Math.round(r.totalMinutes ?? 0),
    }));

    const mostFrequent = rows.length > 0 ? rows[0].activityName : null;

    const [longest] = await this.db
      .select({ max: sql<number>`COALESCE(MAX(duration_minutes), 0)` })
      .from(s)
      .where(and(baseWhere, sql`${s.durationMinutes} IS NOT NULL`));

    return {
      mostFrequentActivity: mostFrequent ?? null,
      longestSessionMinutes: Math.round(longest?.max ?? 0),
      sessionsByActivity,
    };
  }

  async getActivity(userId: string, forceRefresh = false) {
    return this.getOrCompute(userId, 'activity', () => this.computeActivity(userId), forceRefresh);
  }

  /* ── Money ── */

  async computeMoney(userId: string): Promise<MoneyStats> {
    const t = schema.transactions;
    const baseWhere = and(eq(t.userId, userId), isNull(t.deletedAt));

    // totals
    const [totals] = await this.db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`.as('income'),
        expense: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`.as('expense'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(t)
      .where(baseWhere);

    const totalIncome = totals?.income ?? 0;
    const totalExpense = totals?.expense ?? 0;
    const totalTransactions = totals?.count ?? 0;

    // biggest income
    const [bigInc] = await this.db
      .select({ amount: t.amount, date: t.date, notes: t.notes })
      .from(t)
      .where(and(baseWhere, eq(t.type, 'income')))
      .orderBy(desc(t.amount))
      .limit(1);

    // biggest expense
    const [bigExp] = await this.db
      .select({ amount: t.amount, date: t.date, notes: t.notes, category: t.category })
      .from(t)
      .where(and(baseWhere, eq(t.type, 'expense')))
      .orderBy(desc(t.amount))
      .limit(1);

    // income by category
    const incCatRows = await this.db
      .select({
        category: t.category,
        amount: sql<number>`COALESCE(SUM(amount), 0)`.as('amount'),
      })
      .from(t)
      .where(and(baseWhere, eq(t.type, 'income')))
      .groupBy(t.category)
      .orderBy(desc(sql`COALESCE(SUM(amount), 0)`));

    // expense by category
    const expCatRows = await this.db
      .select({
        category: t.category,
        amount: sql<number>`COALESCE(SUM(amount), 0)`.as('amount'),
      })
      .from(t)
      .where(and(baseWhere, eq(t.type, 'expense')))
      .groupBy(t.category)
      .orderBy(desc(sql`COALESCE(SUM(amount), 0)`));

    return {
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      netSavings: Math.round(totalIncome - totalExpense),
      totalTransactions,
      biggestIncome: bigInc ? { amount: bigInc.amount ?? 0, date: bigInc.date ?? '', notes: bigInc.notes ?? null } : null,
      biggestExpense: bigExp ? { amount: bigExp.amount ?? 0, date: bigExp.date ?? '', notes: bigExp.notes ?? null, category: bigExp.category ?? '' } : null,
      incomeByCategory: incCatRows.map((r) => ({ category: r.category ?? '', amount: Math.round(r.amount ?? 0) })),
      expenseByCategory: expCatRows.map((r) => ({ category: r.category ?? '', amount: Math.round(r.amount ?? 0) })),
    };
  }

  async getMoney(userId: string, forceRefresh = false) {
    return this.getOrCompute(userId, 'money', () => this.computeMoney(userId), forceRefresh);
  }

  /* ── Habit ── */

  async computeHabit(userId: string): Promise<HabitStats> {
    const habits = schema.habits;
    const habitLogs = schema.habitLogs;

    const allHabits = await this.db.query.habits.findMany({
      where: (h, { eq }) => eq(h.userId, userId),
    });

    const totalHabits = allHabits.length;
    let totalCompletions = 0;
    let totalMissed = 0;
    let bestStreak = 0;
    let bestStreakHabitName: string | null = null;
    let bestConsistency = 0;
    let mostConsistentName: string | null = null;

    const habitsArr: { name: string; completionRate: number; bestStreak: number; currentStreak: number }[] = [];

    for (const h of allHabits) {
      const [doneRow] = await this.db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(habitLogs)
        .where(and(eq(habitLogs.habitId, h.id), eq(habitLogs.status, 'done')));

      const [missedRow] = await this.db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(habitLogs)
        .where(and(eq(habitLogs.habitId, h.id), eq(habitLogs.status, 'missed')));

      const done = doneRow?.cnt ?? 0;
      const missed = missedRow?.cnt ?? 0;
      const total = done + missed;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;

      totalCompletions += done;
      totalMissed += missed;

      if (h.bestStreak > bestStreak) {
        bestStreak = h.bestStreak;
        bestStreakHabitName = h.name;
      }

      if (total > 0 && rate > bestConsistency) {
        bestConsistency = rate;
        mostConsistentName = h.name;
      }

      habitsArr.push({
        name: h.name,
        completionRate: rate,
        bestStreak: h.bestStreak,
        currentStreak: h.currentStreak,
      });
    }

    return {
      totalHabits,
      bestStreak,
      bestStreakHabitName,
      totalCompletions,
      totalMissed,
      mostConsistentHabit: mostConsistentName ? { name: mostConsistentName, completionRate: bestConsistency } : null,
      habits: habitsArr,
    };
  }

  async getHabit(userId: string, forceRefresh = false) {
    return this.getOrCompute(userId, 'habit', () => this.computeHabit(userId), forceRefresh);
  }

  /* ── Goal ── */

  async computeGoal(userId: string): Promise<GoalStats> {
    const goals = schema.goals;
    const milestones = schema.milestones;

    const allGoals = await this.db.query.goals.findMany({
      where: (g, { eq }) => eq(g.userId, userId),
    });

    let activeGoals = 0;
    let completedGoals = 0;
    let archivedGoals = 0;
    let atRiskGoals = 0;
    let totalProgress = 0;
    let totalMilestonesCount = 0;
    let completedMilestonesCount = 0;

    const goalsArr: { title: string; status: string; progressPercent: number; milestoneCount: number; completedMilestoneCount: number }[] = [];

    for (const g of allGoals) {
      switch (g.status) {
        case 'active': activeGoals++; break;
        case 'completed': completedGoals++; break;
        case 'archived': archivedGoals++; break;
        case 'at_risk': atRiskGoals++; break;
      }
      totalProgress += g.progressPercent ?? 0;

      const [msRow] = await this.db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(milestones)
        .where(eq(milestones.goalId, g.id));

      const [doneMsRow] = await this.db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(milestones)
        .where(and(eq(milestones.goalId, g.id), eq(milestones.isCompleted, true)));

      const msCount = msRow?.cnt ?? 0;
      const doneMsCount = doneMsRow?.cnt ?? 0;
      totalMilestonesCount += msCount;
      completedMilestonesCount += doneMsCount;

      goalsArr.push({
        title: g.title,
        status: g.status,
        progressPercent: g.progressPercent ?? 0,
        milestoneCount: msCount,
        completedMilestoneCount: doneMsCount,
      });
    }

    return {
      totalGoals: allGoals.length,
      activeGoals,
      completedGoals,
      archivedGoals,
      atRiskGoals,
      averageProgressPercent: allGoals.length > 0 ? Math.round((totalProgress / allGoals.length) * 100) / 100 : 0,
      totalMilestones: totalMilestonesCount,
      completedMilestones: completedMilestonesCount,
      goals: goalsArr,
    };
  }

  async getGoal(userId: string, forceRefresh = false) {
    return this.getOrCompute(userId, 'goal', () => this.computeGoal(userId), forceRefresh);
  }

  /* ── Cache invalidation (called from domain service write hooks) ── */

  async invalidate(userId: string, scope?: Scope): Promise<void> {
    const conditions = [eq(schema.statisticsCache.userId, userId)];
    if (scope) conditions.push(eq(schema.statisticsCache.scope, scope));
    await this.db.delete(schema.statisticsCache).where(and(...conditions));
  }

  /* ── Convenience: all stats at once ── */

  async getAll(userId: string, forceRefresh = false) {
    const [overall, time, activity, money, habit, goal] = await Promise.all([
      this.getOverall(userId, forceRefresh),
      this.getTime(userId, forceRefresh),
      this.getActivity(userId, forceRefresh),
      this.getMoney(userId, forceRefresh),
      this.getHabit(userId, forceRefresh),
      this.getGoal(userId, forceRefresh),
    ]);
    return { overall, time, activity, money, habit, goal };
  }
}
