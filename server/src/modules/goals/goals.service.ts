import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { StatisticsService } from '../statistics/statistics.service';
import { PlannerService } from '../planner/planner.service';
import { AchievementsEventGateway } from '../achievements/achievements.gateway';

function computeProgress(db: DbInstance, goalId: string) {
  return db
    .select({
      completed: sql<number>`SUM(CASE WHEN is_completed THEN 1 ELSE 0 END)`.as('completed'),
      total: sql<number>`COUNT(*)`.as('total'),
    })
    .from(schema.milestones)
    .where(eq(schema.milestones.goalId, goalId))
    .then((rows) => {
      const row = rows[0];
      if (!row || row.total === 0) return 0;
      return Math.round((row.completed / row.total) * 100);
    });
}

@Injectable()
export class GoalsService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private statisticsService: StatisticsService,
    @Inject(forwardRef(() => PlannerService)) private plannerService: PlannerService,
    private achievementsGateway: AchievementsEventGateway,
  ) {}

  /* ── Goals ── */

  async listGoals(userId: string) {
    return this.db.query.goals.findMany({
      where: (g, { eq }) => eq(g.userId, userId),
      orderBy: (g, { desc }) => [desc(g.createdAt)],
    });
  }

  async getGoal(userId: string, goalId: string) {
    const goal = await this.db.query.goals.findFirst({
      where: (g, { eq, and }) => and(eq(g.id, goalId), eq(g.userId, userId)),
    });
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async createGoal(userId: string, data: { title: string; description?: string; targetDate?: string }) {
    const [goal] = await this.db
      .insert(schema.goals)
      .values({
        id: randomUUID(),
        userId,
        title: data.title,
        description: data.description || null,
        targetDate: data.targetDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    await this.statisticsService.invalidate(userId, 'goal');
    await this.statisticsService.invalidate(userId, 'overall');
    return goal;
  }

  async updateGoal(
    userId: string,
    goalId: string,
    data: { title?: string; description?: string | null; targetDate?: string | null; status?: string; progressPercent?: number },
  ) {
    const existing = await this.db.query.goals.findFirst({
      where: (g, { eq, and }) => and(eq(g.id, goalId), eq(g.userId, userId)),
    });
    if (!existing) throw new NotFoundException('Goal not found');

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progressPercent !== undefined) updateData.progressPercent = data.progressPercent;

    const [updated] = await this.db
      .update(schema.goals)
      .set(updateData)
      .where(eq(schema.goals.id, goalId))
      .returning();
    await this.statisticsService.invalidate(userId, 'goal');
    await this.statisticsService.invalidate(userId, 'overall');
    return updated;
  }

  async deleteGoal(userId: string, goalId: string) {
    const existing = await this.db.query.goals.findFirst({
      where: (g, { eq, and }) => and(eq(g.id, goalId), eq(g.userId, userId)),
    });
    if (!existing) throw new NotFoundException('Goal not found');

    const [deleted] = await this.db
      .delete(schema.goals)
      .where(eq(schema.goals.id, goalId))
      .returning();
    await this.statisticsService.invalidate(userId, 'goal');
    await this.statisticsService.invalidate(userId, 'overall');
    return deleted;
  }

  /* ── Milestones ── */

  async listMilestones(goalId: string) {
    return this.db.query.milestones.findMany({
      where: (m, { eq }) => eq(m.goalId, goalId),
      orderBy: (m, { asc }) => [m.createdAt],
    });
  }

  async createMilestone(goalId: string, data: { title: string; targetDate?: string }) {
    const goal = await this.db.query.goals.findFirst({
      where: (g, { eq }) => eq(g.id, goalId),
    });
    if (!goal) throw new NotFoundException('Goal not found');

    const [milestone] = await this.db
      .insert(schema.milestones)
      .values({
        id: randomUUID(),
        goalId,
        title: data.title,
        targetDate: data.targetDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Recompute goal progress
    const pct = await computeProgress(this.db, goalId);
    await this.db.update(schema.goals).set({ progressPercent: pct }).where(eq(schema.goals.id, goalId));

    const goalData = await this.db.query.goals.findFirst({ where: (g, { eq }) => eq(g.id, goalId) });
    if (goalData) {
      await this.statisticsService.invalidate(goalData.userId, 'goal');
      await this.statisticsService.invalidate(goalData.userId, 'overall');
    }
    return milestone;
  }

  async updateMilestone(
    goalId: string,
    milestoneId: string,
    data: { title?: string; targetDate?: string | null; isCompleted?: boolean },
  ) {
    const existing = await this.db.query.milestones.findFirst({
      where: (m, { eq, and }) => and(eq(m.id, milestoneId), eq(m.goalId, goalId)),
    });
    if (!existing) throw new NotFoundException('Milestone not found');

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

    const [updated] = await this.db
      .update(schema.milestones)
      .set(updateData)
      .where(eq(schema.milestones.id, milestoneId))
      .returning();

    // Recompute goal progress
    const pct = await computeProgress(this.db, goalId);
    await this.db.update(schema.goals).set({ progressPercent: pct }).where(eq(schema.goals.id, goalId));

    const goalData = await this.db.query.goals.findFirst({ where: (g, { eq }) => eq(g.id, goalId) });
    if (goalData) {
      await this.statisticsService.invalidate(goalData.userId, 'goal');
      await this.statisticsService.invalidate(goalData.userId, 'overall');

      // Check if goal just completed — all milestones done
      if (data.isCompleted) {
        const milestones = await this.db.query.milestones.findMany({
          where: (m, { eq }) => eq(m.goalId, goalId),
        });
        const allDone = milestones.every(m => m.isCompleted);
        if (allDone) {
          const totalGoals = (await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.goals)
            .where(and(eq(schema.goals.userId, goalData.userId), sql`progress_percent = 100`)))[0]?.count || 0;
          this.achievementsGateway.onGoalCompleted(goalData.userId, totalGoals).catch(() => {});
        }
      }
    }
    return updated;
  }

  async deleteMilestone(goalId: string, milestoneId: string) {
    const existing = await this.db.query.milestones.findFirst({
      where: (m, { eq, and }) => and(eq(m.id, milestoneId), eq(m.goalId, goalId)),
    });
    if (!existing) throw new NotFoundException('Milestone not found');

    const [deleted] = await this.db
      .delete(schema.milestones)
      .where(eq(schema.milestones.id, milestoneId))
      .returning();

    // Recompute goal progress
    const pct = await computeProgress(this.db, goalId);
    await this.db.update(schema.goals).set({ progressPercent: pct }).where(eq(schema.goals.id, goalId));

    const goalData = await this.db.query.goals.findFirst({ where: (g, { eq }) => eq(g.id, goalId) });
    if (goalData) {
      await this.statisticsService.invalidate(goalData.userId, 'goal');
      await this.statisticsService.invalidate(goalData.userId, 'overall');
    }
    return deleted;
  }

  /* ── Goals with milestones (for page load) ── */

  async listGoalsWithMilestones(userId: string) {
    const goalsList = await this.listGoals(userId);
    return Promise.all(
      goalsList.map(async (goal) => {
        const milestones = await this.listMilestones(goal.id);
        return { ...goal, milestones };
      }),
    );
  }

  /* ── Extended ── */

  async scheduleMilestone(
    userId: string,
    goalId: string,
    milestoneId: string,
    dto: { date: string; startTime: string; endTime: string },
  ) {
    const milestone = await this.db.query.milestones.findFirst({
      where: (m, { eq, and }) => and(eq(m.id, milestoneId), eq(m.goalId, goalId)),
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const [startH, startM] = dto.startTime.split(':').map(Number);
    const [endH, endM] = dto.endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    const event = await this.plannerService.create(userId, {
      title: `Milestone: ${milestone.title}`,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      durationMinutes: Math.max(durationMinutes, 15),
      category: 'goal',
      sourceType: 'goal_milestone',
      sourceId: milestoneId,
    });

    await this.db
      .update(schema.milestones)
      .set({ generatedEventId: event.id })
      .where(eq(schema.milestones.id, milestoneId));

    await this.statisticsService.invalidate(userId, 'goal');
    await this.statisticsService.invalidate(userId, 'overall');

    return event;
  }

  async getLinkedItems(userId: string, goalId: string) {
    const [habits, tasks] = await Promise.all([
      this.db.query.habits.findMany({
        where: (h, { eq }) => eq(h.linkedGoalId, goalId),
        columns: { id: true, name: true },
      }),
      this.db.query.tasks.findMany({
        where: (t, { eq }) => eq(t.linkedGoalId, goalId),
        columns: { id: true, title: true },
      }),
    ]);

    return [
      ...habits.map((h) => ({ type: 'habit' as const, id: h.id, title: h.name })),
      ...tasks.map((t) => ({ type: 'task' as const, id: t.id, title: t.title })),
    ];
  }
}
