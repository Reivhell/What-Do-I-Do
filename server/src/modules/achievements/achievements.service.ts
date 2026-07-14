import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AchievementWithProgress } from './dto/achievements.dto';

@Injectable()
export class AchievementsService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
  ) {}

  async findAll(userId: string): Promise<AchievementWithProgress[]> {
    const rows = await this.db
      .select({
        id: schema.achievementDefinitions.id,
        title: schema.achievementDefinitions.title,
        description: schema.achievementDefinitions.description,
        requirementType: schema.achievementDefinitions.requirementType,
        requirementValue: schema.achievementDefinitions.requirementValue,
        icon: schema.achievementDefinitions.icon,
        category: schema.achievementDefinitions.category,
        progress: sql<number>`COALESCE(${schema.userAchievements.progress}, 0)`,
        unlockedAt: schema.userAchievements.unlockedAt,
        userAchievementId: schema.userAchievements.id,
      })
      .from(schema.achievementDefinitions)
      .leftJoin(
        schema.userAchievements,
        and(
          eq(schema.achievementDefinitions.id, schema.userAchievements.achievementId),
          eq(schema.userAchievements.userId, userId),
        ),
      )
      .orderBy(schema.achievementDefinitions.category, schema.achievementDefinitions.requirementValue);

    return rows as unknown as AchievementWithProgress[];
  }

  async findUnlocked(userId: string): Promise<AchievementWithProgress[]> {
    const all = await this.findAll(userId);
    return all.filter(a => a.unlockedAt !== null);
  }

  async findOne(userId: string, achievementId: string): Promise<AchievementWithProgress | null> {
    const all = await this.findAll(userId);
    return all.find(a => a.id === achievementId) || null;
  }

  async evaluate(userId: string, eventType: string, eventValue: number): Promise<string[]> {
    const defs = await this.db
      .select()
      .from(schema.achievementDefinitions)
      .where(eq(schema.achievementDefinitions.requirementType, eventType));

    const newlyUnlocked: string[] = [];

    for (const def of defs) {
      const existing = await this.db
        .select()
        .from(schema.userAchievements)
        .where(and(
          eq(schema.userAchievements.userId, userId),
          eq(schema.userAchievements.achievementId, def.id),
        ))
        .limit(1);

      let newProgress = eventValue;

      if (existing.length > 0) {
        if (['total_hours_tracked', 'streak_days', 'budget_kept', 'days_active'].includes(eventType)) {
          newProgress = Math.max(existing[0].progress, eventValue);
        } else {
          newProgress = existing[0].progress + eventValue;
        }
      }

      const now = new Date().toISOString();
      const unlocked = newProgress >= def.requirementValue ? now : null;

      await this.db
        .insert(schema.userAchievements)
        .values({
          id: randomUUID(),
          userId,
          achievementId: def.id,
          progress: newProgress,
          unlockedAt: unlocked,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [schema.userAchievements.userId, schema.userAchievements.achievementId],
          set: {
            progress: newProgress,
            unlockedAt: sql`COALESCE(${schema.userAchievements.unlockedAt}, ${unlocked})`,
            updatedAt: now,
          },
        });

      if (unlocked && (!existing[0]?.unlockedAt)) {
        newlyUnlocked.push(def.id);
      }
    }

    return newlyUnlocked;
  }
}
