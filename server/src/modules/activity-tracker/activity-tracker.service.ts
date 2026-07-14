import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, isNull, like, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { StatisticsService } from '../statistics/statistics.service';
import { AchievementsEventGateway } from '../achievements/achievements.gateway';

@Injectable()
export class ActivityTrackerService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
    private statisticsService: StatisticsService,
    private achievementsGateway: AchievementsEventGateway,
  ) {}

  async getActiveSession(userId: string) {
    return this.db.query.activitySessions.findFirst({
      where: (s, { eq, and, isNull }) => and(
        eq(s.userId, userId),
        isNull(s.endTime),
        isNull(s.deletedAt),
      ),
    });
  }

  async start(userId: string, data: { activityName: string; category: string; sourceEventId?: string; note?: string }) {
    const active = await this.getActiveSession(userId);
    if (active) {
      await this.stop(userId, active.id);
    }

    const [session] = await this.db
      .insert(schema.activitySessions)
      .values({
        id: randomUUID(),
        userId,
        activityName: data.activityName,
        category: data.category,
        startTime: new Date().toISOString(),
        source: 'live',
        note: data.note || null,
        sourceEventId: data.sourceEventId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    await this.statisticsService.invalidate(userId, 'time');
    await this.statisticsService.invalidate(userId, 'activity');
    await this.statisticsService.invalidate(userId, 'overall');
    return session;
  }

  async stop(userId: string, sessionId: string) {
    const session = await this.db.query.activitySessions.findFirst({
      where: (s, { eq, and }) => and(eq(s.id, sessionId), eq(s.userId, userId)),
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.endTime) throw new BadRequestException('Session already stopped');

    const endTime = new Date().toISOString();
    const elapsedMs = new Date(endTime).getTime() - new Date(session.startTime).getTime();
    const durationMinutes = Math.max(1, Math.round(elapsedMs / 60000));

    const [updated] = await this.db
      .update(schema.activitySessions)
      .set({ endTime, durationMinutes, updatedAt: endTime })
      .where(eq(schema.activitySessions.id, sessionId))
      .returning();
    await this.statisticsService.invalidate(userId, 'time');
    await this.statisticsService.invalidate(userId, 'activity');
    await this.statisticsService.invalidate(userId, 'overall');

    // Fire-and-forget achievement evaluation
    const totalSessions = await this.getTotalSessions(userId);
    const totalHours = await this.getTotalHours(userId);
    this.achievementsGateway.onSessionCompleted(userId, totalSessions, totalHours).catch(() => {});

    return updated;
  }

  private async getTotalSessions(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.activitySessions)
      .where(and(eq(schema.activitySessions.userId, userId), sql`end_time IS NOT NULL`));
    return result[0]?.count || 0;
  }

  private async getTotalHours(userId: string): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(duration_minutes), 0) / 60.0` })
      .from(schema.activitySessions)
      .where(and(eq(schema.activitySessions.userId, userId), sql`end_time IS NOT NULL AND duration_minutes IS NOT NULL`));
    return Math.round((result[0]?.total || 0) * 10) / 10;
  }

  async manualLog(
    userId: string,
    data: { activityName: string; category: string; startTime: string; endTime: string; note?: string },
  ) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (end <= start) throw new BadRequestException('endTime must be after startTime');

    const elapsedMs = end.getTime() - start.getTime();
    const durationMinutes = Math.max(1, Math.round(elapsedMs / 60000));

    const [session] = await this.db
      .insert(schema.activitySessions)
      .values({
        id: randomUUID(),
        userId,
        activityName: data.activityName,
        category: data.category,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes,
        source: 'manual',
        note: data.note || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    await this.statisticsService.invalidate(userId, 'time');
    await this.statisticsService.invalidate(userId, 'activity');
    await this.statisticsService.invalidate(userId, 'overall');
    return session;
  }

  async list(
    userId: string,
    filters?: { search?: string; category?: string; dateFrom?: string; dateTo?: string },
  ) {
    const conditions = [
      eq(schema.activitySessions.userId, userId),
      isNull(schema.activitySessions.deletedAt),
    ];

    if (filters?.search) {
      conditions.push(like(schema.activitySessions.activityName, `%${filters.search}%`));
    }
    if (filters?.category) {
      conditions.push(eq(schema.activitySessions.category, filters.category));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(schema.activitySessions.startTime, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(schema.activitySessions.startTime, filters.dateTo));
    }

    return this.db.query.activitySessions.findMany({
      where: (s, { eq, and, isNull, like, gte, lte }) => and(...conditions),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
  }

  async update(
    userId: string,
    sessionId: string,
    data: { activityName?: string; category?: string; durationMinutes?: number; note?: string | null },
  ) {
    const session = await this.db.query.activitySessions.findFirst({
      where: (s, { eq, and }) => and(eq(s.id, sessionId), eq(s.userId, userId)),
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.deletedAt) throw new BadRequestException('Session is deleted');

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.activityName !== undefined) updateData.activityName = data.activityName;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.note !== undefined) updateData.note = data.note;

    if (data.durationMinutes !== undefined && session.endTime) {
      // Recalculate endTime based on new duration
      const newEnd = new Date(new Date(session.startTime).getTime() + data.durationMinutes * 60000);
      updateData.endTime = newEnd.toISOString();
    }

    const [updated] = await this.db
      .update(schema.activitySessions)
      .set(updateData)
      .where(eq(schema.activitySessions.id, sessionId))
      .returning();
    await this.statisticsService.invalidate(userId, 'time');
    await this.statisticsService.invalidate(userId, 'activity');
    await this.statisticsService.invalidate(userId, 'overall');
    return updated;
  }

  async softDelete(userId: string, sessionId: string) {
    const session = await this.db.query.activitySessions.findFirst({
      where: (s, { eq, and }) => and(eq(s.id, sessionId), eq(s.userId, userId)),
    });
    if (!session) throw new NotFoundException('Session not found');

    const now = new Date().toISOString();
    const [deleted] = await this.db
      .update(schema.activitySessions)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.activitySessions.id, sessionId))
      .returning();
    await this.statisticsService.invalidate(userId, 'time');
    await this.statisticsService.invalidate(userId, 'activity');
    await this.statisticsService.invalidate(userId, 'overall');
    return deleted;
  }
}
