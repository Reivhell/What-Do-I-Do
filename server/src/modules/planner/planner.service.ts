import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ActivityTrackerService } from '../activity-tracker/activity-tracker.service';
import { AchievementsEventGateway } from '../achievements/achievements.gateway';

export type PlannerStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
export type SourceType = 'manual' | 'task' | 'habit' | 'goal_milestone';
export type ViewRange = 'daily' | '3days' | 'weekly' | 'monthly';

interface RepeatRule {
  freq: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endCondition?: { type: 'count'; count: number } | { type: 'date'; date: string };
}

function expandRepeatRule(rule: RepeatRule, fromDate: string, maxInstances = 52): string[] {
  const dates: string[] = [];
  const current = new Date(fromDate + 'T00:00:00');
  const endDate = rule.endCondition?.type === 'date'
    ? new Date(rule.endCondition.date + 'T00:00:00')
    : null;
  const maxCount = rule.endCondition?.type === 'count'
    ? rule.endCondition.count
    : maxInstances;

  let count = 0;
  while (dates.length < maxCount && count < 365) {
    if (rule.freq === 'daily') {
      current.setDate(current.getDate() + rule.interval);
    } else if (rule.freq === 'weekly') {
      current.setDate(current.getDate() + 1);
      if (rule.daysOfWeek && !rule.daysOfWeek.includes(current.getDay())) continue;
    } else if (rule.freq === 'monthly') {
      current.setMonth(current.getMonth() + rule.interval);
    }
    count++;

    const dateStr = current.toISOString().split('T')[0];
    if (endDate && dateStr > endDate.toISOString().split('T')[0]) break;
    if (dateStr > fromDate) dates.push(dateStr);
  }
  return dates;
}

@Injectable()
export class PlannerService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    @Inject(forwardRef(() => ActivityTrackerService))
    private activityTracker: ActivityTrackerService,
    private achievementsGateway: AchievementsEventGateway,
  ) {}

  async listByDate(userId: string, date: string) {
    return this.db.query.plannerEvents.findMany({
      where: (events, { eq, and }) => and(
        eq(events.userId, userId),
        eq(events.date, date),
      ),
      orderBy: (events, { asc }) => [asc(events.startTime)],
    });
  }

  async listByRange(userId: string, range: ViewRange, date: string) {
    const baseDate = new Date(date + 'T00:00:00');
    let startDate: string, endDate: string;

    switch (range) {
      case 'daily': {
        startDate = date;
        endDate = date;
        break;
      }
      case '3days': {
        startDate = date;
        const d = new Date(baseDate);
        d.setDate(d.getDate() + 2);
        endDate = d.toISOString().split('T')[0];
        break;
      }
      case 'weekly': {
        const dow = baseDate.getDay();
        const mon = new Date(baseDate);
        mon.setDate(baseDate.getDate() - ((dow + 6) % 7));
        startDate = mon.toISOString().split('T')[0];
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        endDate = sun.toISOString().split('T')[0];
        break;
      }
      case 'monthly': {
        startDate = date.slice(0, 7) + '-01';
        const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate = lastDay.toISOString().split('T')[0];
        break;
      }
    }

    return this.db.query.plannerEvents.findMany({
      where: (events, { eq, and, gte, lte }) => and(
        eq(events.userId, userId),
        gte(events.date, startDate),
        lte(events.date, endDate),
      ),
      orderBy: (events, { asc }) => [asc(events.date), asc(events.startTime)],
    });
  }

  async create(
    userId: string,
    data: {
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      category?: string;
      priority?: string;
      notes?: string;
      sourceType?: SourceType;
      sourceId?: string;
      scheduledEventId?: string;
      repeatRule?: RepeatRule;
      reminderTime?: string;
    },
  ) {
    const [event] = await this.db
      .insert(schema.plannerEvents)
      .values({
        id: randomUUID(),
        userId,
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        category: data.category,
        priority: data.priority || 'medium',
        notes: data.notes,
        reminderTime: data.reminderTime,
        sourceType: data.sourceType || 'manual',
        sourceId: data.sourceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (data.repeatRule) {
      await this.generateRepeatInstances(userId, event.id);
    }

    return event;
  }

  async generateRepeatInstances(userId: string, sourceEventId: string) {
    const event = await this.db.query.plannerEvents.findFirst({
      where: (events, { eq }) => eq(events.id, sourceEventId),
    });
    if (!event || !event.repeatRule) return [];

    const dates = expandRepeatRule(event.repeatRule as unknown as RepeatRule, event.date);
    const instances = [];

    for (const date of dates) {
      const existing = await this.db.query.plannerEvents.findFirst({
        where: (events, { eq, and }) => and(
          eq(events.userId, userId),
          eq(events.date, date),
          eq(events.startTime, event.startTime),
          eq(events.title, event.title),
        ),
      });
      if (existing) continue;

      const [instance] = await this.db.insert(schema.plannerEvents).values({
        id: randomUUID(),
        userId,
        title: event.title,
        date,
        startTime: event.startTime,
        endTime: event.endTime,
        durationMinutes: event.durationMinutes,
        category: event.category,
        priority: event.priority,
        notes: event.notes,
        repeatRule: null,
        sourceType: 'manual',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      instances.push(instance);
    }
    return instances;
  }

  async update(id: string, userId: string, data: Partial<{ title: string; date: string; startTime: string; endTime: string; durationMinutes: number; category: string; priority: string; notes: string; status: PlannerStatus; reminderTime: string }>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.reminderTime !== undefined) updateData.reminderTime = data.reminderTime;

    const [event] = await this.db
      .update(schema.plannerEvents)
      .set(updateData)
      .where(and(eq(schema.plannerEvents.id, id), eq(schema.plannerEvents.userId, userId)))
      .returning();

    if (data.status === 'completed' && event) {
      const totalCompleted = (await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.plannerEvents)
        .where(and(eq(schema.plannerEvents.userId, userId), eq(schema.plannerEvents.status, 'completed'))))[0]?.count || 0;
      this.achievementsGateway.onPlannerEventCompleted(userId, totalCompleted).catch(() => {});
    }

    return event;
  }

  async delete(id: string, userId: string) {
    return this.db
      .delete(schema.plannerEvents)
      .where(and(eq(schema.plannerEvents.id, id), eq(schema.plannerEvents.userId, userId)))
      .returning();
  }

  async scheduleFromTask(userId: string, taskId: string, data: { date: string; startTime: string; endTime: string; durationMinutes: number }) {
    // Dapatkan task info sebagai draft
    const task = await this.db.query.tasks.findFirst({
      where: (tasks, { eq, and }) => and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });
    if (!task) throw new Error('Task not found');

    const event = await this.create(userId, {
      title: task.title,
      ...data,
      sourceType: 'task',
      sourceId: taskId,
    });

    // Update task dengan scheduled_event_id
    await this.db
      .update(schema.tasks)
      .set({ scheduledEventId: event.id, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)));

    return event;
  }

  async scheduleFromMilestone(userId: string, milestoneId: string, data: { date: string; startTime: string; endTime: string; durationMinutes: number }) {
    const goal = await this.db.query.milestones.findFirst({
      where: (ms, { eq }) => eq(ms.id, milestoneId),
    });
    if (!goal) throw new Error('Goal milestone not found');

    return this.create(userId, {
      title: `Goal: ${goal.title}`,
      ...data,
      sourceType: 'goal_milestone',
      sourceId: milestoneId,
    });
  }

  async startEvent(id: string, userId: string) {
    const event = await this.db.query.plannerEvents.findFirst({
      where: (events, { eq, and }) => and(
        eq(events.id, id),
        eq(events.userId, userId),
      ),
    });
    if (!event) throw new Error('Planner event not found');
    if (event.status === 'completed' || event.status === 'cancelled') {
      throw new Error('Cannot start a completed or cancelled event');
    }

    const session = await this.activityTracker.start(userId, {
      activityName: event.title,
      category: event.category || 'general',
      sourceEventId: id,
    });

    await this.db
      .update(schema.plannerEvents)
      .set({
        status: 'in_progress',
        realizedSessionId: session.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.plannerEvents.id, id));

    const updated = await this.db.query.plannerEvents.findFirst({
      where: (events, { eq }) => eq(events.id, id),
    });
    return { event: updated, session };
  }
}
