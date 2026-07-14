import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { StatisticsService } from '../statistics/statistics.service';
import { PlannerService } from '../planner/planner.service';
import { CreateHabitDto, UpdateHabitDto, LogHabitDto, HabitResponse, HabitLogResponse, RepeatRule } from './dto/habit.dto';

export interface HabitWithLogs extends HabitResponse {
  logs: HabitLogResponse[];
}

@Injectable()
export class HabitsService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private statisticsService: StatisticsService,
    @Inject(forwardRef(() => PlannerService)) private plannerService: PlannerService,
  ) {}

  async create(userId: string, dto: CreateHabitDto): Promise<HabitResponse> {
    const [habit] = await this.db
      .insert(schema.habits)
      .values({
        id: randomUUID(),
        userId,
        name: dto.name,
        targetFrequency: dto.targetFrequency,
        repeatRule: dto.repeatRule,
        notes: dto.notes ?? null,
        linkedGoalId: dto.linkedGoalId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return this.mapHabit(habit);
  }

  async findAll(userId: string): Promise<HabitResponse[]> {
    const habits = await this.db.query.habits.findMany({
      where: (h, { eq }) => eq(h.userId, userId),
      orderBy: (h, { desc }) => [desc(h.createdAt)],
    });
    return habits.map(this.mapHabit);
  }

  async findOne(id: string, userId: string): Promise<HabitResponse | null> {
    const habit = await this.db.query.habits.findFirst({
      where: (h, { eq, and }) => and(eq(h.id, id), eq(h.userId, userId)),
    });
    return habit ? this.mapHabit(habit) : null;
  }

  async update(id: string, userId: string, dto: UpdateHabitDto): Promise<HabitResponse> {
    const habit = await this.findOne(id, userId);
    if (!habit) throw new NotFoundException('Habit not found');

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.targetFrequency !== undefined) updateData.targetFrequency = dto.targetFrequency;
    if (dto.repeatRule !== undefined) updateData.repeatRule = dto.repeatRule;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.linkedGoalId !== undefined) updateData.linkedGoalId = dto.linkedGoalId;

    const [updated] = await this.db
      .update(schema.habits)
      .set(updateData)
      .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, userId)))
      .returning();

    return this.mapHabit(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const habit = await this.findOne(id, userId);
    if (!habit) throw new NotFoundException('Habit not found');

    await this.db
      .delete(schema.habits)
      .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, userId)));
    await this.statisticsService.invalidate(userId, 'habit');
    await this.statisticsService.invalidate(userId, 'overall');
  }

  async generatePlannerEvents(userId: string, date: string): Promise<void> {
    const habits = await this.db.query.habits.findMany({
      where: (h, { eq }) => eq(h.userId, userId),
    });

    for (const habit of habits) {
      if (!habit.repeatRule) continue;
      const rule = habit.repeatRule as RepeatRule;
      // Skip if habit's repeat rule doesn't cover this weekday
      const dow = new Date(date + 'T00:00:00').getDay();
      const adjustedDow = dow === 0 ? 7 : dow; // mon=1..sun=7
      if (rule.daysOfWeek && !rule.daysOfWeek.includes(adjustedDow)) continue;

      // Check existing event for this habit+date to avoid duplicates
      const existing = await this.db.query.plannerEvents.findFirst({
        where: (e, { eq, and }) => and(
          eq(e.userId, userId),
          eq(e.sourceType, 'habit'),
          eq(e.sourceId, habit.id),
          eq(e.date, date),
        ),
      });
      if (existing) continue;

      // Auto-schedule at 09:00 for 1h by default
      await this.plannerService.create(userId, {
        title: habit.name,
        date,
        startTime: `${date}T09:00:00.000Z`,
        endTime: `${date}T10:00:00.000Z`,
        durationMinutes: 60,
        sourceType: 'habit',
        sourceId: habit.id,
      });
    }
  }

  async logHabit(habitId: string, userId: string, dto: LogHabitDto): Promise<HabitLogResponse> {
    const habit = await this.findOne(habitId, userId);
    if (!habit) throw new NotFoundException('Habit not found');

    // Upsert habit log
    const [log] = await this.db
      .insert(schema.habitLogs)
      .values({
        id: randomUUID(),
        habitId,
        date: dto.date,
        status: dto.status,
        linkedEventId: dto.linkedEventId ?? null,
        linkedSessionId: dto.linkedSessionId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [schema.habitLogs.habitId, schema.habitLogs.date],
        set: {
          status: dto.status,
          linkedEventId: dto.linkedEventId ?? null,
          linkedSessionId: dto.linkedSessionId ?? null,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    // Recompute streaks and counts from ALL logs
    const allLogs = await this.getLogs(habitId, userId);
    const { currentStreak, bestStreak, completionCount, missedCount } = HabitsService.computeStreaks(allLogs);

    // Update habit with recomputed values
    await this.db
      .update(schema.habits)
      .set({
        currentStreak,
        bestStreak,
        completionCount,
        missedCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.habits.id, habitId));

    await this.statisticsService.invalidate(userId, 'habit');
    await this.statisticsService.invalidate(userId, 'overall');
    return this.mapHabitLog(log);
  }

  async getLogs(habitId: string, userId: string, range?: { from: string; to: string }): Promise<HabitLogResponse[]> {
    // Verify habit belongs to user
    const habit = await this.findOne(habitId, userId);
    if (!habit) throw new NotFoundException('Habit not found');

    const conditions = [eq(schema.habitLogs.habitId, habitId)];
    if (range?.from) conditions.push(gte(schema.habitLogs.date, range.from));
    if (range?.to) conditions.push(lte(schema.habitLogs.date, range.to));

    const logs = await this.db.query.habitLogs.findMany({
      where: (l, { and }) => and(...conditions),
      orderBy: (l, { desc }) => [desc(l.date)],
    });
    return logs.map(this.mapHabitLog);
  }

  async getHabitWithLogs(habitId: string, userId: string): Promise<HabitWithLogs | null> {
    const habit = await this.findOne(habitId, userId);
    if (!habit) return null;
    const logs = await this.getLogs(habitId, userId);
    return { ...habit, logs };
  }

  /**
   * Compute streaks from habit logs.
   * Current streak: consecutive 'done' days ending at most recent log date (or today if today is done)
   * Best streak: max consecutive 'done' days ever
   */
  static computeStreaks(logs: HabitLogResponse[]): {
    currentStreak: number;
    bestStreak: number;
    completionCount: number;
    missedCount: number;
  } {
    if (logs.length === 0) {
      return { currentStreak: 0, bestStreak: 0, completionCount: 0, missedCount: 0 };
    }

    // Sort by date ascending
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    
    let bestStreak = 0;
    let currentStreak = 0;
    let completionCount = 0;
    let missedCount = 0;

    // Count totals
    for (const log of sorted) {
      if (log.status === 'done') completionCount++;
      if (log.status === 'missed') missedCount++;
    }

    // Compute best streak (max consecutive 'done')
    let streak = 0;
    for (const log of sorted) {
      if (log.status === 'done') {
        streak++;
        bestStreak = Math.max(bestStreak, streak);
      } else {
        streak = 0;
      }
    }

    // Compute current streak (consecutive 'done' from most recent date backwards)
    // Find the most recent log date
    const mostRecentLog = sorted[sorted.length - 1];
    const today = new Date().toISOString().split('T')[0];
    
    // If most recent log is today or yesterday and it's 'done', start counting back
    let checkDate = mostRecentLog.date;
    if (mostRecentLog.date === today && mostRecentLog.status === 'done') {
      // Today is done, count back from today
    } else if (this.isYesterday(mostRecentLog.date, today) && mostRecentLog.status === 'done') {
      // Yesterday was done, count back from yesterday
    } else {
      // Streak broken
      currentStreak = 0;
      return { currentStreak, bestStreak, completionCount, missedCount };
    }

    // Count consecutive 'done' backwards
    const logMap = new Map(sorted.map(l => [l.date, l.status]));
    let current = checkDate;
    
    while (true) {
      const status = logMap.get(current);
      if (status === 'done') {
        currentStreak++;
        // Go to previous day
        const d = new Date(current + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        current = d.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    return { currentStreak, bestStreak, completionCount, missedCount };
  }

  private static isYesterday(dateStr: string, todayStr: string): boolean {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getTime() === yesterday.getTime();
  }

  private mapHabit(h: any): HabitResponse {
    return {
      id: h.id,
      userId: h.userId,
      name: h.name,
      targetFrequency: h.targetFrequency,
      repeatRule: h.repeatRule,
      currentStreak: h.currentStreak,
      bestStreak: h.bestStreak,
      completionCount: h.completionCount,
      missedCount: h.missedCount,
      notes: h.notes,
      linkedGoalId: h.linkedGoalId,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    };
  }

private mapHabitLog(l: any): HabitLogResponse {
    return {
      id: l.id,
      habitId: l.habitId,
      date: l.date,
      status: l.status,
      linkedEventId: l.linkedEventId,
      linkedSessionId: l.linkedSessionId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
  }
}