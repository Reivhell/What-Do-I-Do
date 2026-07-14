# Achievements Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full Achievements module — Drizzle schema, NestJS backend with in-process rule engine, claymorphism React UI with unlocked/locked/progress badge states, event hooks in source modules (Activity Tracker, Habits, Goals, Planner, Money).

**Architecture:** Read-only observer listening to write endpoints in Activity Tracker, Habits, Goals, Planner, Money. In-process rule engine evaluates `requirement_type` on incoming events, UPSERTs `user_achievements`, sets `unlocked_at` on threshold reached. Frontend renders claymorphism badge grid with three visual states (unlocked, locked+progress, locked+no-data), category filter tabs, and level counter.

**Tech Stack:** NestJS 11 + Drizzle ORM + SQLite, React 19 + TypeScript, Tailwind CSS + existing claymorphism design tokens (`Card`, `ProgressRing`, `Badge`, `clay-l1`, `clay-l2`, `bg-clay-surface`).

## Global Constraints

- `user_id` always `'default'` for single-user local-first model (constants file in modules)
- Drizzle tables use `$defaultFn(() => randomUUID())` for UUID PKs
- All timestamps stored ISO 8601 UTC
- `DEFAULT_USER_ID = 'default'` in every controller
- Achievement definitions are seed-only — no user-facing CRUD endpoints
- Rule engine must be idempotent (UPSERT by user+achievement)
- Source module event hooks are single function calls after successful writes

---

### Parallelization Strategy (Multi-Agent)

| Phase | Parallel Agents | Depends On |
|---|---|---|
| **A: Foundation** | Agent A1: Drizzle schema + migration + seed | Nothing |
| | Agent A2: Backend DTOs + client types | Nothing |
| **B1: Backend Core** | Agent B1: Rule engine service | A1 |
| | Agent B2: Controller + module registration | A2, B1 |
| **B2: Client Core** | Agent B3: API client | A2 |
| **C: UI** | Agent C1: AchievementCard component | B3 |
| | Agent C2: AchievementGrid, Header, Page | C1 |
| **D: Integration** | Agent D1: Event gateway + hooks in source modules | B2 |
| **E: Verification** | Agent E1: E2E test | D1 |

---

### Task 1: Drizzle Schema + Migration + Seed Data

**Files:**
- Create: `server/src/drizzle/schema/achievements.ts`
- Modify: `server/src/drizzle/schema/index.ts`
- Create: `server/src/modules/achievements/seed.ts`

**Interfaces:**
- Consumes: DB connection via Drizzle provider
- Produces: `schema.achievementDefinitions`, `schema.userAchievements` — exportable drizzle table objects

- [ ] **1.1: Create achievements schema**

```typescript
// server/src/drizzle/schema/achievements.ts
import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { randomUUID } from 'crypto';

export const achievementDefinitions = sqliteTable('achievement_definitions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requirementType: text('requirement_type').notNull(),
  requirementValue: real('requirement_value').notNull(),
  icon: text('icon').notNull(),
  category: text('category').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const userAchievements = sqliteTable('user_achievements', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull().references(() => achievementDefinitions.id, { onDelete: 'cascade' }),
  progress: real('progress').notNull().default(0),
  unlockedAt: text('unlocked_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userAchievementUnique: uniqueIndex('idx_user_achievement_unique').on(table.userId, table.achievementId),
  userIdx: index('idx_user_achievements_user').on(table.userId),
}));
```

- [ ] **1.2: Register in schema index**

```typescript
// server/src/drizzle/schema/index.ts — add line:
export { achievementDefinitions, userAchievements } from './achievements';
```

- [ ] **1.3: Generate migration**

```bash
cd server && npx drizzle-kit generate
```

Expected: creates migration file in `server/src/drizzle/migrations/` and updates `_journal.json`.

- [ ] **1.4: Create seed data**

```typescript
// server/src/modules/achievements/seed.ts
import { achievementDefinitions } from '../../drizzle/schema/achievements';
import type { DbInstance } from '../../drizzle';

export const ACHIEVEMENT_SEEDS = [
  // Activity
  { title: 'First Steps', description: 'Complete your first activity session', requirementType: 'sessions_completed', requirementValue: 1, icon: '🎯', category: 'activity' },
  { title: 'Dedicated', description: 'Log 10 hours of tracked activity', requirementType: 'total_hours_tracked', requirementValue: 10, icon: '⏱️', category: 'activity' },
  { title: 'Century', description: 'Log 100 hours of tracked activity', requirementType: 'total_hours_tracked', requirementValue: 100, icon: '💪', category: 'activity' },
  { title: 'Marathoner', description: 'Complete 50 activity sessions', requirementType: 'sessions_completed', requirementValue: 50, icon: '🏃', category: 'activity' },
  // Habits
  { title: 'Consistency', description: 'Complete your first habit log', requirementType: 'habit_completions', requirementValue: 1, icon: '✅', category: 'habits' },
  { title: 'Week Warrior', description: 'Reach a 7-day streak on any habit', requirementType: 'streak_days', requirementValue: 7, icon: '🔥', category: 'habits' },
  { title: 'Monthly Master', description: 'Reach a 30-day streak on any habit', requirementType: 'streak_days', requirementValue: 30, icon: '💎', category: 'habits' },
  { title: 'Habit Stacker', description: 'Complete 100 habit logs total', requirementType: 'habit_completions', requirementValue: 100, icon: '📊', category: 'habits' },
  // Goals
  { title: 'Achiever', description: 'Complete your first goal', requirementType: 'goal_completed', requirementValue: 1, icon: '🏆', category: 'goals' },
  { title: 'Goal Crusher', description: 'Complete 5 goals', requirementType: 'goal_completed', requirementValue: 5, icon: '🚀', category: 'goals' },
  // Planner
  { title: 'Planner', description: 'Complete your first planner event', requirementType: 'planner_events_completed', requirementValue: 1, icon: '📅', category: 'planner' },
  { title: 'Scheduler', description: 'Complete 50 planner events', requirementType: 'planner_events_completed', requirementValue: 50, icon: '🗓️', category: 'planner' },
  // Money — real check for budget_kept needs consecutive counter
  { title: 'Pennywise', description: 'Stay under budget for one period', requirementType: 'budget_kept', requirementValue: 1, icon: '💰', category: 'money' },
  { title: 'Budget Master', description: 'Stay under budget for 3 periods in a row', requirementType: 'budget_kept', requirementValue: 3, icon: '🤑', category: 'money' },
  // Loyalty
  { title: 'Week One', description: 'Use the app for 7 days', requirementType: 'days_active', requirementValue: 7, icon: '🌟', category: 'loyalty' },
  { title: 'One Month', description: 'Use the app for 30 days', requirementType: 'days_active', requirementValue: 30, icon: '⭐', category: 'loyalty' },
];

export async function seedAchievements(db: DbInstance) {
  const existing = await db.select().from(achievementDefinitions).limit(1);
  if (existing.length > 0) return; // already seeded

  await db.insert(achievementDefinitions).values(
    ACHIEVEMENT_SEEDS.map(a => ({ ...a, id: randomUUID() }))
  );
}
```

- [ ] **1.5: Run migration, then verify**

```bash
cd server && npx drizzle-kit migrate
```

- [ ] **1.6: Commit**

```bash
git add server/src/drizzle/schema/achievements.ts server/src/drizzle/schema/index.ts server/src/drizzle/migrations/ server/src/modules/achievements/seed.ts
git commit -m "feat(achievements): add Drizzle schema, migration, and seed data"
```

---

### Task 2: Backend DTOs + Shared Types

**Files:**
- Create: `server/src/modules/achievements/dto/achievements.dto.ts`
- Create: `server/src/modules/achievements/dto/index.ts`
- Create: `client/src/types/achievements.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `AchievementDefinitionResponse`, `UserAchievementResponse`, `AchievementWithProgress`, `EvaluateEventDto` used by Tasks 3, 6, 7

- [ ] **2.1: Backend response DTOs**

```typescript
// server/src/modules/achievements/dto/achievements.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class AchievementDefinitionResponse {
  id!: string;
  title!: string;
  description!: string;
  requirementType!: string;
  requirementValue!: number;
  icon!: string;
  category!: string;
}

export class UserAchievementResponse {
  id!: string;
  userId!: string;
  achievementId!: string;
  progress!: number;
  unlockedAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

// Joined response for the grid view
export interface AchievementWithProgress extends AchievementDefinitionResponse {
  progress: number;
  unlockedAt: string | null;
  userAchievementId: string | null;
}

// Internal evaluate call
export class EvaluateEventDto {
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsNumber()
  eventValue!: number;
}
```

- [ ] **2.2: DTO barrel export**

```typescript
// server/src/modules/achievements/dto/index.ts
export * from './achievements.dto';
```

- [ ] **2.3: Client types**

```typescript
// client/src/types/achievements.ts
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  requirementType: string;
  requirementValue: number;
  icon: string;
  category: string;
}

export interface AchievementWithProgress extends AchievementDefinition {
  progress: number;
  unlockedAt: string | null;
  userAchievementId: string | null;
}

export type AchievementCategory = 'activity' | 'habits' | 'goals' | 'planner' | 'money' | 'loyalty';
```

- [ ] **2.4: Commit**

```bash
git add server/src/modules/achievements/dto/ client/src/types/achievements.ts
git commit -m "feat(achievements): add DTOs and shared types"
```

---

### Task 3: Achievements Backend Module — Service + Rule Engine

**Files:**
- Create: `server/src/modules/achievements/achievements.service.ts`
- Create: `server/src/modules/achievements/achievements.controller.ts`
- Create: `server/src/modules/achievements/achievements.module.ts`
- Create: `server/src/modules/achievements/achievements.gateway.ts`

**Interfaces:**
- Consumes: `schema.achievementDefinitions`, `schema.userAchievements`, `DbInstance`, `DRIZZLE` injection token
- Produces: `AchievementsService` with `findAll()`, `findUnlocked()`, `findOne()`, `evaluate()`. `AchievementsEventGateway` with event hooks.

- [ ] **3.1: Create achievements service**

```typescript
// server/src/modules/achievements/achievements.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import { schema } from '../../drizzle';
import type { DbInstance } from '../../drizzle';
import { eq, and, lte, sql } from 'drizzle-orm';
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
      // UPSERT: insert or update progress
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
        // For cumulative types, take the max (total counters sent from source)
        // For incremental types, add the delta
        // Both converge to: newProgress = MAX(existing.progress, eventValue) for cumulative
        // or newProgress = existing.progress + eventValue for incremental
        // We determine by whether requirementType typically represents a total or a delta
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
```

- [ ] **3.2: Create event gateway**

```typescript
// server/src/modules/achievements/achievements.gateway.ts
import { Injectable } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Injectable()
export class AchievementsEventGateway {
  constructor(private achievementsService: AchievementsService) {}

  async onSessionCompleted(userId: string, totalSessions: number, totalHours: number) {
    const unlocked = await this.achievementsService.evaluate(userId, 'sessions_completed', totalSessions);
    const unlocked2 = await this.achievementsService.evaluate(userId, 'total_hours_tracked', totalHours);
    return [...unlocked, ...unlocked2];
  }

  async onStreakUpdated(userId: string, streakDays: number, totalCompletions: number) {
    const unlocked = await this.achievementsService.evaluate(userId, 'streak_days', streakDays);
    const unlocked2 = await this.achievementsService.evaluate(userId, 'habit_completions', totalCompletions);
    return [...unlocked, ...unlocked2];
  }

  async onGoalCompleted(userId: string, totalGoalsCompleted: number) {
    return this.achievementsService.evaluate(userId, 'goal_completed', totalGoalsCompleted);
  }

  async onPlannerEventCompleted(userId: string, totalCompleted: number) {
    return this.achievementsService.evaluate(userId, 'planner_events_completed', totalCompleted);
  }

  async onBudgetKept(userId: string, consecutiveKept: number) {
    return this.achievementsService.evaluate(userId, 'budget_kept', consecutiveKept);
  }
}
```

- [ ] **3.3: Create controller**

```typescript
// server/src/modules/achievements/achievements.controller.ts
import {
  Controller, Get, Post, Body, Param, ParseUUIDPipe,
  UsePipes, ValidationPipe,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { EvaluateEventDto, AchievementWithProgress } from './dto/achievements.dto';

const DEFAULT_USER_ID = 'default';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async findAll(): Promise<AchievementWithProgress[]> {
    return this.achievementsService.findAll(DEFAULT_USER_ID);
  }

  @Get('unlocked')
  async findUnlocked(): Promise<AchievementWithProgress[]> {
    return this.achievementsService.findUnlocked(DEFAULT_USER_ID);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AchievementWithProgress | null> {
    return this.achievementsService.findOne(DEFAULT_USER_ID, id);
  }

  @Post('evaluate')
  async evaluate(@Body() dto: EvaluateEventDto): Promise<string[]> {
    return this.achievementsService.evaluate(DEFAULT_USER_ID, dto.eventType, dto.eventValue);
  }
}
```

- [ ] **3.4: Create module**

```typescript
// server/src/modules/achievements/achievements.module.ts
import { Module } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementsEventGateway } from './achievements.gateway';

@Module({
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementsEventGateway],
  exports: [AchievementsEventGateway],
})
export class AchievementsModule {}
```

- [ ] **3.5: Commit**

```bash
git add server/src/modules/achievements/
git commit -m "feat(achievements): add NestJS module, service, controller, event gateway"
```

---

### Task 4: Register AchievementsModule in AppModule

**Files:**
- Modify: `server/src/app.module.ts`
- Modify: `server/src/modules/achievements/seed.ts` (add seed on startup)

- [ ] **4.1: Add to app module imports**

```typescript
// server/src/app.module.ts — add line in imports array:
import { AchievementsModule } from './modules/achievements/achievements.module';
// add AchievementsModule to imports array
```

- [ ] **4.2: Wire seed on startup** — call `seedAchievements(db)` in `main.ts` or via `OnModuleInit` lifecycle hook

Add to `AchievementsModule`:
```typescript
// add to server/src/modules/achievements/achievements.module.ts
import { OnModuleInit } from '@nestjs/common';
import { seedAchievements } from './seed';
// inside class AchievementsModule implements OnModuleInit:
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}
  async onModuleInit() {
    await seedAchievements(this.db);
  }
```

- [ ] **4.3: Verify module compiles and server starts**

```bash
cd server && npx nest build
```

Expected: no errors.

- [ ] **4.4: Commit**

```bash
git add server/src/app.module.ts server/src/modules/achievements/
git commit -m "feat(achievements): register module and auto-seed on startup"
```

---

### Task 5: Client API Client

**Files:**
- Create: `client/src/api/achievements.ts`

**Interfaces:**
- Consumes: `AchievementWithProgress` from `../types/achievements`
- Produces: `getAchievements()`, `getUnlocked()`, `getAchievement(id)` — used by Tasks 6, 7, 8

- [ ] **5.1: Create API client**

```typescript
// client/src/api/achievements.ts
import type { AchievementWithProgress } from '../types/achievements';

const BASE = '/api/achievements';

export async function getAchievements(): Promise<AchievementWithProgress[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
}

export async function getUnlocked(): Promise<AchievementWithProgress[]> {
  const res = await fetch(`${BASE}/unlocked`);
  if (!res.ok) throw new Error('Failed to fetch unlocked achievements');
  return res.json();
}

export async function getAchievement(id: string): Promise<AchievementWithProgress> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Achievement not found');
  return res.json();
}
```

- [ ] **5.2: Commit**

```bash
git add client/src/api/achievements.ts
git commit -m "feat(achievements): add client API client"
```

---

### Task 6: AchievementCard Component

**Files:**
- Create: `client/src/components/achievements/AchievementCard.tsx`

**Interfaces:**
- Consumes: `AchievementWithProgress` type, `Card`, `Badge`, `ProgressRing` from `../ui`
- Produces: `<AchievementCard achievement={} />` used in Task 7

- [ ] **6.1: Create AchievementCard component**

```tsx
// client/src/components/achievements/AchievementCard.tsx
import { Card, Badge } from '../ui/Card'; // adjust imports
import { ProgressRing } from '../ui/ProgressRing';
import type { AchievementWithProgress } from '../../types/achievements';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
}

const categoryColors: Record<string, string> = {
  activity: 'info',
  habits: 'success',
  goals: 'warning',
  planner: 'default',
  money: 'danger',
  loyalty: 'outline',
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const hasProgress = achievement.progress > 0;
  const pct = Math.min(100, Math.round((achievement.progress / achievement.requirementValue) * 100));

  return (
    <Card
      level={1}
      className={`
        relative flex flex-col items-center gap-3 p-5 text-center transition-all duration-300
        ${isUnlocked ? 'shadow-[0_0_20px_rgba(34,197,94,0.15)]' : ''}
        ${!isUnlocked && !hasProgress ? 'opacity-60' : ''}
      `}
    >
      {/* Badge icon */}
      <div className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}>
        {achievement.icon}
      </div>

      {/* Title */}
      <h4 className={`font-display text-sm font-semibold ${isUnlocked ? 'text-ink-900' : 'text-ink-500'}`}>
        {isUnlocked ? achievement.title : hasProgress ? achievement.title : '???'}
      </h4>

      {/* Description */}
      <p className="font-body text-xs text-ink-400 leading-relaxed">
        {isUnlocked || hasProgress ? achievement.description : 'Keep going to discover this achievement'}
      </p>

      {/* Progress or unlocked badge */}
      {isUnlocked ? (
        <Badge variant="success">Unlocked</Badge>
      ) : hasProgress ? (
        <div className="flex flex-col items-center gap-1">
          <ProgressRing value={pct} size={48} strokeWidth={4} />
          <span className="font-mono text-[11px] text-ink-400">
            {achievement.progress}/{achievement.requirementValue}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="size-12 rounded-full bg-ink-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-lg text-ink-300">?</span>
          </div>
          <span className="font-mono text-[11px] text-ink-400">???/{achievement.requirementValue}</span>
        </div>
      )}

      {/* Category badge */}
      <div className="absolute top-2 right-2">
        <Badge variant={categoryColors[achievement.category] || 'default'}>
          {achievement.category}
        </Badge>
      </div>
    </Card>
  );
}
```

- [ ] **6.2: Commit**

```bash
git add client/src/components/achievements/
git commit -m "feat(achievements): add AchievementCard component with 3 visual states"
```

---

### Task 7: AchievementGrid + AchievementsHeader

**Files:**
- Create: `client/src/components/achievements/AchievementGrid.tsx`
- Create: `client/src/components/achievements/AchievementsHeader.tsx`

**Interfaces:**
- Consumes: `AchievementWithProgress[]`, `AchievementCard`, category filter state
- Produces: `<AchievementsHeader />` + `<AchievementGrid />` used in Task 8

- [ ] **7.1: AchievementsHeader component**

```tsx
// client/src/components/achievements/AchievementsHeader.tsx
interface AchievementsHeaderProps {
  totalUnlocked: number;
  totalAchievements: number;
  level: number;
}

export function AchievementsHeader({ totalUnlocked, totalAchievements, level }: AchievementsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Achievements</h2>
        <p className="font-body text-sm text-ink-400 mt-0.5">
          {totalUnlocked} / {totalAchievements} unlocked
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 clay-l1 rounded-xl px-4 py-2">
          <span className="text-xl">⭐</span>
          <div className="text-left">
            <p className="font-display text-xs text-ink-400 uppercase tracking-wide">Level</p>
            <p className="font-display text-lg font-bold text-ink-900 -mt-0.5">{level}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **7.2: AchievementGrid component**

```tsx
// client/src/components/achievements/AchievementGrid.tsx
import { useState, useMemo } from 'react';
import { AchievementCard } from './AchievementCard';
import type { AchievementWithProgress } from '../../types/achievements';

interface AchievementGridProps {
  achievements: AchievementWithProgress[];
}

const CATEGORIES = ['all', 'activity', 'habits', 'goals', 'planner', 'money', 'loyalty'] as const;

export function AchievementGrid({ achievements }: AchievementGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = useMemo(() =>
    activeCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === activeCategory),
    [achievements, activeCategory],
  );

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              font-body text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-xl
              transition-all duration-200 whitespace-nowrap
              ${activeCategory === cat
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                : 'clay-l1 text-ink-500 hover:text-ink-700'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(a => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center font-body text-sm text-ink-400 py-12">
          No achievements in this category yet.
        </p>
      )}
    </div>
  );
}
```

- [ ] **7.3: Create component barrel export**

Create or update `client/src/components/achievements/index.ts`:
```typescript
export { AchievementCard } from './AchievementCard';
export { AchievementGrid } from './AchievementGrid';
export { AchievementsHeader } from './AchievementsHeader';
```

- [ ] **7.4: Commit**

```bash
git add client/src/components/achievements/
git commit -m "feat(achievements): add AchievementGrid and AchievementsHeader components"
```

---

### Task 8: Achievements Page + Route

**Files:**
- Create: `client/src/pages/Achievements.tsx`
- Modify: `client/src/App.tsx`

- [ ] **8.1: Create Achievements page**

```tsx
// client/src/pages/Achievements.tsx
import { useState, useEffect } from 'react';
import { AchievementsHeader, AchievementGrid } from '../components/achievements';
import { getAchievements } from '../api/achievements';
import type { AchievementWithProgress } from '../types/achievements';

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements()
      .then(setAchievements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalUnlocked = achievements.filter(a => a.unlockedAt).length;
  const level = Math.floor(totalUnlocked / 3) + 1;

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="animate-pulse font-body text-sm text-ink-400">Loading achievements…</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <AchievementsHeader
        totalUnlocked={totalUnlocked}
        totalAchievements={achievements.length}
        level={level}
      />
      <AchievementGrid achievements={achievements} />
    </div>
  );
}
```

- [ ] **8.2: Wire route in App.tsx**

```typescript
// In client/src/App.tsx:
import { AchievementsPage } from './pages/Achievements';
// Change:
// <Route path="/achievements" element={<PlaceholderPage title="Achievements" />} />
// To:
<Route path="/achievements" element={<AchievementsPage />} />
```

- [ ] **8.3: Verify page renders**

```bash
# In another terminal, ensure Vite is running (it should auto-refresh)
# Open browser to http://localhost:5173/achievements
```

- [ ] **8.4: Commit**

```bash
git add client/src/pages/Achievements.tsx client/src/App.tsx
git commit -m "feat(achievements): add Achievements page and route"
```

---

### Task 9: Event Hooks in Source Modules

**Files:**
- Modify: `server/src/modules/activity-tracker/activity-tracker.module.ts`
- Modify: `server/src/modules/activity-tracker/activity-tracker.service.ts`
- Modify: `server/src/modules/habits/habits.module.ts`
- Modify: `server/src/modules/habits/habits.service.ts`
- Modify: `server/src/modules/goals/goals.module.ts`
- Modify: `server/src/modules/goals/goals.service.ts`
- Modify: `server/src/modules/planner/planner.module.ts`
- Modify: `server/src/modules/planner/planner.service.ts`
- Modify: `server/src/modules/money/money.module.ts`
- Modify: `server/src/modules/money/money.service.ts`

- [ ] **9.1: Inject AchievementsEventGateway into Activity Tracker + hook in `stop()`**

In `activity-tracker.module.ts`:
```typescript
import { AchievementsModule } from '../achievements/achievements.module';
// add to imports: forwardRef(() => AchievementsModule)
```

In `activity-tracker.service.ts`:
```typescript
// add constructor param:
@Inject(forwardRef(() => AchievementsEventGateway))
private achievementsGateway: AchievementsEventGateway,
// at end of stop() method, before return:
const totalSessions = await this.getTotalSessions(userId);
const totalHours = await this.getTotalHours(userId);
await this.achievementsGateway.onSessionCompleted(userId, totalSessions, totalHours);
// add helper methods:
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
```

- [ ] **9.2: Inject into Habits + hook in `logHabit()`**

In `habits.module.ts`: import + add `AchievementsModule` to imports.

In `habits.service.ts`, in `logHabit()` method, after successful log insert:
```typescript
await this.achievementsGateway.onStreakUpdated(userId, habit.currentStreak, habit.completionCount);
```
(Streak and completion count are on the habit row after increment.)

- [ ] **9.3: Inject into Goals + hook on milestone/goal completion**

In `goals.module.ts`: import + add `AchievementsModule` to imports.

In `goals.service.ts`, in `updateMilestone()` method — if milestone status changes to completed and goal completes:
```typescript
// after the milestone update, check if goal just completed
const milestones = await this.listMilestones(goalId);
const allDone = milestones.every(m => m.status === 'completed');
if (allDone) {
  const totalCompleted = await this.getTotalCompletedGoals(userId);
  await this.achievementsGateway.onGoalCompleted(userId, totalCompleted);
}
```

- [ ] **9.4: Inject into Planner + hook on event update to completed**

In `planner.module.ts`: import + add `AchievementsModule` to imports.

In `planner.service.ts`, in `update()` — after successful update where status changed to 'completed':
```typescript
if (data.status === 'completed') {
  const total = await this.getCompletedEvents(userId);
  await this.achievementsGateway.onPlannerEventCompleted(userId, total);
}
```

- [ ] **9.5: Money budget hooks** (budget kept detection)

In `money.module.ts`: import + add `AchievementsModule` to imports.

For budget kept — detect when a transaction is created within a budget period and total spending stays under limit. Simpler approach: `ponytail: skip budget_kept auto-detection for now — user marks budgets manually. Achievements still show via POST /achievements/evaluate for manual trigger or future cron.`

- [ ] **9.6: Verify integration — curl test**

```bash
# Start backend, then trigger a habit log
curl -X POST http://localhost:3000/api/habits/<habit-id>/log \
  -H 'Content-Type: application/json' \
  -d '{"date": "2026-07-14", "status": "done"}'

# Check achievements
curl http://localhost:3000/api/achievements
```

Expected: first habit/done streak achievements show progress or unlocked.

- [ ] **9.7: Commit**

```bash
git add server/src/modules/
git commit -m "feat(achievements): wire event hooks into Activity Tracker, Habits, Goals, Planner"
```

---

### Task 10: End-to-End Verification

**Files:**
- Test script: `scripts/verify-achievements.sh`

- [ ] **10.1: Create verification script**

```bash
#!/usr/bin/env bash
# scripts/verify-achievements.sh — run after backend is started
set -euo pipefail

BASE="http://localhost:3000"

echo "=== 1. Check achievements list ==="
curl -s "$BASE/api/achievements" | head -c 200
echo

echo "=== 2. Check unlocked ==="
curl -s "$BASE/api/achievements/unlocked" | head -c 200
echo

echo "=== 3. Evaluate a fake event ==="
curl -s -X POST "$BASE/api/achievements/evaluate" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sessions_completed", "eventValue": 1}'
echo

echo "=== 4. Verify unlock happened ==="
curl -s "$BASE/api/achievements" | python3 -c "
import sys, json
data = json.load(sys.stdin)
unlocked = [a for a in data if a['unlockedAt']]
print(f'Total: {len(data)}, Unlocked: {len(unlocked)}')
for a in unlocked:
    print(f'  ✓ {a[\"icon\"]} {a[\"title\"]}')
"
```

- [ ] **10.2: Run verification**

```bash
bash scripts/verify-achievements.sh
```

- [ ] **10.3: Fix any issues found** and re-test until all checks pass

- [ ] **10.4: Commit**

```bash
git add scripts/verify-achievements.sh
git commit -m "test(achievements): add E2E verification script"
```
