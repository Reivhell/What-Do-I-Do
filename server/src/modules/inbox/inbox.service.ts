import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { TasksService } from '../tasks/tasks.service';
import { PlannerService } from '../planner/planner.service';
import { HabitsService } from '../habits/habits.service';
import { GoalsService } from '../goals/goals.service';
import { MoneyService } from '../money/money.service';

export type CaptureSource = 'manual' | 'voice' | 'share_intent';
export type CaptureStatus = 'unprocessed' | 'processed' | 'archived';
export type ConvertTargetType = 'task' | 'planner_event' | 'habit' | 'goal' | 'money_note';

@Injectable()
export class InboxService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private tasksService: TasksService,
    private plannerService: PlannerService,
    private habitsService: HabitsService,
    private goalsService: GoalsService,
    private moneyService: MoneyService,
  ) {}

  private detectDate(rawText: string): string | null {
    const patterns = [
      /\b(\d{4}-\d{2}-\d{2})\b/,       // 2024-01-31
      /\b(\d{1,2})\/(\d{1,2})\b/,       // 1/31 or 12/25
      /\b(today|tomorrow|next week)\b/i,
    ];
    for (const pat of patterns) {
      const m = rawText.match(pat);
      if (!m) continue;
      if (pat === patterns[0]) return m[1];
      if (pat === patterns[1]) {
        const now = new Date();
        return `${now.getFullYear()}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
      }
      if (pat === patterns[2]) {
        const d = new Date();
        const kw = m[1].toLowerCase();
        if (kw === 'tomorrow') d.setDate(d.getDate() + 1);
        else if (kw === 'next week') d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
      }
    }
    return null;
  }

  async list(userId: string, status?: CaptureStatus, q?: string) {
    const conditions = [eq(schema.captureItems.userId, userId)];
    if (status) conditions.push(eq(schema.captureItems.status, status));

    let rows = await this.db.query.captureItems.findMany({
      where: and(...conditions),
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });

    if (q) {
      const lq = q.toLowerCase();
      rows = rows.filter(r => r.rawText.toLowerCase().includes(lq));
    }

    return rows;
  }

  async create(
    userId: string,
    data: { rawText: string; source?: CaptureSource; tags?: string[] },
  ) {
    const detectedDate = this.detectDate(data.rawText);
    const [item] = await this.db
      .insert(schema.captureItems)
      .values({
        id: randomUUID(),
        userId,
        rawText: data.rawText,
        source: data.source ?? 'manual',
        tags: data.tags ?? [],
        detectedDate,
        capturedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return item;
  }

  async update(
    id: string,
    userId: string,
    data: { rawText?: string; tags?: string[]; pinned?: boolean; status?: CaptureStatus },
  ) {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.rawText !== undefined) {
      updateData.rawText = data.rawText;
      updateData.detectedDate = this.detectDate(data.rawText);
    }
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.pinned !== undefined) updateData.pinned = data.pinned;
    if (data.status !== undefined) updateData.status = data.status;

    return this.db
      .update(schema.captureItems)
      .set(updateData)
      .where(and(eq(schema.captureItems.id, id), eq(schema.captureItems.userId, userId)))
      .returning();
  }

  async archive(id: string, userId: string) {
    return this.db
      .update(schema.captureItems)
      .set({ status: 'archived', updatedAt: new Date().toISOString() })
      .where(and(eq(schema.captureItems.id, id), eq(schema.captureItems.userId, userId)))
      .returning();
  }

  async convert(id: string, userId: string, targetType: ConvertTargetType) {
    const [item] = await this.db
      .select()
      .from(schema.captureItems)
      .where(and(eq(schema.captureItems.id, id), eq(schema.captureItems.userId, userId)));
    if (!item) throw new NotFoundException('Capture item not found');
    if (item.status !== 'unprocessed') throw new BadRequestException('Item already processed or archived');

    let convertedId: string;

    switch (targetType) {
      case 'task': {
        const task = await this.tasksService.create(userId, { title: item.rawText });
        convertedId = task.id;
        break;
      }
      case 'planner_event': {
        const day = item.detectedDate ?? new Date().toISOString().split('T')[0];
        const event = await this.plannerService.create(userId, {
          title: item.rawText,
          date: day,
          startTime: day,
          endTime: day,
          durationMinutes: 60,
        });
        convertedId = event.id;
        break;
      }
      case 'habit': {
        const habit = await this.habitsService.create(userId, {
          name: item.rawText,
          targetFrequency: 'daily',
          repeatRule: { freq: 'daily', interval: 1 },
        });
        convertedId = habit.id;
        break;
      }
      case 'goal': {
        const goal = await this.goalsService.createGoal(userId, { title: item.rawText });
        convertedId = goal.id;
        break;
      }
      case 'money_note': {
        // Inbox cannot create full transactions (needs accountId, amount, type).
        // Mark as processed; user completes it via Money page.
        convertedId = '__requires_money_page__';
        break;
      }
      default:
        throw new BadRequestException(`Conversion to ${targetType} not supported`);
    }

    return this.db
      .update(schema.captureItems)
      .set({
        status: 'processed',
        convertedToType: targetType,
        convertedToId: convertedId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.captureItems.id, id))
      .returning();
  }

  async delete(id: string, userId: string) {
    return this.db
      .delete(schema.captureItems)
      .where(and(eq(schema.captureItems.id, id), eq(schema.captureItems.userId, userId)))
      .returning();
  }
}
