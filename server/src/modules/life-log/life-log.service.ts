import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider.js'
import { schema } from '../../drizzle/index.js'
import type { DbInstance } from '../../drizzle/index.js'
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto/life-log.dto.js'

interface TimelineQueryFilter {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  sources?: string[];
  search?: string;
}

@Injectable()
export class LifeLogService {
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}

  /**
   * Build and execute the UNION ALL query across all 5 source tables.
   * Every public timeline method delegates to this — single source of truth.
   */
  private _queryRawTimeline(userId: string, filter?: TimelineQueryFilter) {
    const { date, dateFrom, dateTo, sources, search } = filter || {};

    const sourceAllowList = sources && sources.length > 0
      ? sources.map(s => `'${s.replace(/'/g, "''")}'`).join(',')
      : "'activity','planner','transaction','habit','annotation'";

    const searchClause = search
      ? sql`AND t.title LIKE ${'%' + search + '%'}`
      : sql``;

    // Outer WHERE conditions for date filtering
    const dateConditions: import('drizzle-orm').SQL[] = [];
    if (date) dateConditions.push(sql`date(t.timestamp) = ${date}`);
    if (dateFrom) dateConditions.push(sql`t.timestamp >= ${dateFrom}`);
    if (dateTo) dateConditions.push(sql`t.timestamp <= ${dateTo}`);
    const outerDateClause = dateConditions.length > 0
      ? sql`AND ${sql.join(dateConditions, sql` AND `)}`
      : sql``;

    // ponytail: inner sub-query date filter only for exact date (optimization for single-day queries)
    const innerDateFilter = date
      ? sql`AND date(start_time) = ${date}`
      : sql``;
    const innerDateFilterPlanner = date
      ? sql`AND date = ${date}`
      : sql``;
    const innerDateFilterHabit = date
      ? sql`AND hl.date = ${date}`
      : sql``;
    const innerDateFilterAnnotation = date
      ? sql`AND date(timestamp) = ${date}`
      : sql``;
    const innerDateFilterTxn = date
      ? sql`AND date = ${date}`
      : sql``;

    // Use raw SQL with UNION ALL for performance
    const query = sql`
      SELECT * FROM (
        SELECT
          'activity' AS source,
          id, user_id AS userId,
          start_time AS timestamp,
          activity_name AS title,
          note AS description,
          NULL AS note,
          duration_minutes AS "durationMinutes",
          category,
          NULL AS amount,
          NULL AS type,
          NULL AS status,
          NULL AS "sourceType"
        FROM activity_sessions
        WHERE user_id = ${userId}
          AND deleted_at IS NULL
          ${innerDateFilter}
          ${search ? sql`AND activity_name LIKE ${'%' + search + '%'}` : sql``}

        UNION ALL

        SELECT
          'planner' AS source,
          id, user_id AS userId,
          date || 'T' || start_time AS timestamp,
          title,
          notes AS description,
          NULL AS note,
          duration_minutes AS "durationMinutes",
          category,
          NULL AS amount,
          NULL AS type,
          status,
          source_type AS "sourceType"
        FROM planner_events
        WHERE user_id = ${userId}
          AND status = 'completed'
          ${innerDateFilterPlanner}
          ${search ? sql`AND title LIKE ${'%' + search + '%'}` : sql``}

        UNION ALL

        SELECT
          'transaction' AS source,
          id, user_id AS userId,
          date AS timestamp,
          category AS title,
          notes AS description,
          NULL AS note,
          NULL AS "durationMinutes",
          type AS category,
          amount,
          type,
          NULL AS status,
          NULL AS "sourceType"
        FROM transactions
        WHERE user_id = ${userId}
          AND deleted_at IS NULL
          ${innerDateFilterTxn}
          ${search ? sql`AND category LIKE ${'%' + search + '%'}` : sql``}

        UNION ALL

        SELECT
          'habit' AS source,
          hl.id, h.user_id AS userId,
          hl.date AS timestamp,
          h.name AS title,
          NULL AS description,
          NULL AS note,
          NULL AS "durationMinutes",
          NULL AS category,
          NULL AS amount,
          NULL AS type,
          hl.status,
          NULL AS "sourceType"
        FROM habit_logs hl
        JOIN habits h ON h.id = hl.habit_id
        WHERE h.user_id = ${userId}
          ${innerDateFilterHabit}
          ${search ? sql`AND h.name LIKE ${'%' + search + '%'}` : sql``}

        UNION ALL

        SELECT
          'annotation' AS source,
          id, user_id AS userId,
          timestamp,
          title,
          description,
          note,
          NULL AS "durationMinutes",
          NULL AS category,
          NULL AS amount,
          NULL AS type,
          NULL AS status,
          NULL AS "sourceType"
        FROM life_log_annotations
        WHERE user_id = ${userId}
          ${innerDateFilterAnnotation}
          ${search ? sql`AND title LIKE ${'%' + search + '%'}` : sql``}
      ) t
      WHERE t.source IN (${sql.raw(sourceAllowList)})
        ${outerDateClause}
        ${searchClause}
      ORDER BY t.timestamp ASC
    `;

    return this.db.all(query) as any[];
  }

  /**
   * Get aggregated timeline from all 4 sources + annotations.
   * Uses UNION ALL via raw SQL — no duplicate storage per architecture.
   */
  async getTimeline(userId: string, date?: string, sources?: string[], search?: string) {
    return this._queryRawTimeline(userId, { date, sources, search });
  }

  async getDailySummary(userId: string, date: string) {
    const [activityCount] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.activitySessions)
      .where(and(eq(schema.activitySessions.userId, userId), sql`date(${schema.activitySessions.startTime}) = ${date}`, sql`${schema.activitySessions.deletedAt} IS NULL`));

    const [plannerCount] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.plannerEvents)
      .where(and(eq(schema.plannerEvents.userId, userId), eq(schema.plannerEvents.status, 'completed'), eq(schema.plannerEvents.date, date)));

    const [txnCount] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.userId, userId), eq(schema.transactions.date, date), sql`${schema.transactions.deletedAt} IS NULL`));

    const [habitCount] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.habitLogs)
      .innerJoin(schema.habits, eq(schema.habitLogs.habitId, schema.habits.id))
      .where(and(eq(schema.habits.userId, userId), eq(schema.habitLogs.date, date)));

    const [annotationCount] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.lifeLogAnnotations)
      .where(and(eq(schema.lifeLogAnnotations.userId, userId), sql`date(${schema.lifeLogAnnotations.timestamp}) = ${date}`));

    return {
      date,
      totalActivities: Number(activityCount?.count ?? 0),
      totalPlannerEvents: Number(plannerCount?.count ?? 0),
      totalTransactions: Number(txnCount?.count ?? 0),
      totalHabitLogs: Number(habitCount?.count ?? 0),
      totalAnnotations: Number(annotationCount?.count ?? 0),
      total: Number(activityCount?.count ?? 0) + Number(plannerCount?.count ?? 0) + Number(txnCount?.count ?? 0) + Number(habitCount?.count ?? 0) + Number(annotationCount?.count ?? 0),
    };
  }

  // ── Annotations CRUD ──

  async createAnnotation(userId: string, dto: CreateAnnotationDto) {
    const [annotation] = await this.db
      .insert(schema.lifeLogAnnotations)
      .values({
        id: randomUUID(),
        userId,
        timestamp: dto.timestamp,
        title: dto.title,
        description: dto.description ?? null,
        note: dto.note ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return annotation;
  }

  async findAllAnnotations(userId: string, date?: string) {
    const conditions = [eq(schema.lifeLogAnnotations.userId, userId)];
    if (date) conditions.push(sql`date(${schema.lifeLogAnnotations.timestamp}) = ${date}`);
    return this.db.query.lifeLogAnnotations.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.lifeLogAnnotations.timestamp)],
    });
  }

  async findAnnotation(id: string, userId: string) {
    const annotation = await this.db.query.lifeLogAnnotations.findFirst({
      where: (a, { eq, and }) => and(eq(a.id, id), eq(a.userId, userId)),
    });
    if (!annotation) throw new NotFoundException('Annotation not found');
    return annotation;
  }

  async updateAnnotation(id: string, userId: string, dto: UpdateAnnotationDto) {
    await this.findAnnotation(id, userId);
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.timestamp !== undefined) updateData.timestamp = dto.timestamp;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.note !== undefined) updateData.note = dto.note;
    const [annotation] = await this.db
      .update(schema.lifeLogAnnotations)
      .set(updateData)
      .where(and(eq(schema.lifeLogAnnotations.id, id), eq(schema.lifeLogAnnotations.userId, userId)))
      .returning();
    return annotation;
  }

  async deleteAnnotation(id: string, userId: string) {
    await this.findAnnotation(id, userId);
    await this.db
      .delete(schema.lifeLogAnnotations)
      .where(and(eq(schema.lifeLogAnnotations.id, id), eq(schema.lifeLogAnnotations.userId, userId)));
  }

  // ── Export ──

  async exportTimeline(userId: string, _format: string, dateFrom?: string, dateTo?: string) {
    return this._queryRawTimeline(userId, { dateFrom, dateTo });
  }
}
