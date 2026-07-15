import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, inArray, sql, desc, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { PlannerService } from '../planner/planner.service';
import { StatisticsService } from '../statistics/statistics.service';

export type TaskStatus = 'inbox' | 'active' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskView = 'inbox' | 'today' | 'upcoming' | 'completed';

export interface TaskWithSubtasks {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  notes: string | null;
  linkedGoalId: string | null;
  scheduledEventId: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleTaskInput {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    @Inject(forwardRef(() => PlannerService))
    private plannerService: PlannerService,
    private statisticsService: StatisticsService,
  ) {}

  async list(userId: string, view?: TaskView) {
    const conditions = [eq(schema.tasks.userId, userId)];

    if (view && view !== 'inbox') {
      conditions.push(sql`${schema.tasks.status} != 'archived'`);
    }

    if (view === 'inbox') {
      conditions.push(eq(schema.tasks.status, 'inbox'));
    } else if (view === 'completed') {
      conditions.push(eq(schema.tasks.status, 'completed'));
    } else if (view === 'today') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(eq(schema.tasks.dueDate, today));
    } else if (view === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(sql`${schema.tasks.dueDate} > ${today}`);
      conditions.push(sql`${schema.tasks.status} != 'completed'`);
    }

    return this.db.query.tasks.findMany({
      where: (tasks, { eq, and }) => and(...conditions),
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });
  }

  async getWithSubtasks(userId: string, taskId: string): Promise<TaskWithSubtasks | null> {
    const task = await this.db.query.tasks.findFirst({
      where: (tasks, { eq, and }) => and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
      with: {
        subtasks: {
          orderBy: (subtasks: any, { asc }: any) => [asc(subtasks.createdAt)],
        },
      },
    });
    return task as TaskWithSubtasks | null;
  }

  async create(userId: string, data: { title: string; description?: string; priority?: TaskPriority; dueDate?: string; tags?: string[]; notes?: string }) {
    const [task] = await this.db
      .insert(schema.tasks)
      .values({
        id: randomUUID(),
        userId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        status: 'inbox',
        dueDate: data.dueDate,
        tags: data.tags || [],
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    await this.statisticsService.invalidate(userId, 'overall');
    return task;
  }

  async update(id: string, userId: string, data: Partial<{ title: string; description: string; status: TaskStatus; priority: TaskPriority; dueDate: string; tags: string[]; notes: string }>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [task] = await this.db
      .update(schema.tasks)
      .set(updateData)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
      .returning();
    await this.statisticsService.invalidate(userId, 'overall');
    return task;
  }

  async delete(id: string, userId: string) {
    const [deleted] = await this.db
      .delete(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
      .returning();
    await this.statisticsService.invalidate(userId, 'overall');
    return deleted;
  }

  async archive(userId: string, taskId: string) {
    return this.update(taskId, userId, { status: 'archived' });
  }

  async bulkUpdateStatus(userId: string, taskIds: string[], status: TaskStatus) {
    if (taskIds.length === 0) return [];

    const updated = await this.db
      .update(schema.tasks)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.tasks.userId, userId), inArray(schema.tasks.id, taskIds)))
      .returning();
    await this.statisticsService.invalidate(userId, 'overall');
    return updated;
  }

  async scheduleTask(userId: string, taskId: string, data: ScheduleTaskInput) {
    // Use PlannerService to create event and link back to task
    const event = await this.plannerService.scheduleFromTask(userId, taskId, data);
    const task = await this.getWithSubtasks(userId, taskId);
    return { task, event };
  }

  // ── Subtasks ──
  async createSubtask(taskId: string, userId: string, title: string) {
    const task = await this.db.query.tasks.findFirst({
      where: (tasks, { eq, and }) => and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });
    if (!task) throw new Error('Task not found');

    const [subtask] = await this.db
      .insert(schema.subtasks)
      .values({
        id: randomUUID(),
        taskId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    await this.statisticsService.invalidate(userId, 'overall');
    return subtask;
  }

  async updateSubtask(subtaskId: string, userId: string, data: { title?: string; isCompleted?: boolean }) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

    const [subtask] = await this.db
      .update(schema.subtasks)
      .set(updateData)
      .where(eq(schema.subtasks.id, subtaskId))
      .returning();
    await this.statisticsService.invalidate(userId, 'overall');
    return subtask;
  }

  async deleteSubtask(subtaskId: string, userId: string) {
    const [deleted] = await this.db
      .delete(schema.subtasks)
      .where(eq(schema.subtasks.id, subtaskId))
      .returning();
    await this.statisticsService.invalidate(userId, 'overall');
    return deleted;
  }
}
