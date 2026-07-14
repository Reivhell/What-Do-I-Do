# Achievements Module — Design Specification

**Date:** 2026-07-14
**Source spec:** `task/12-achievements.md`
**Build phase:** 5 (Retensi & Personalisasi)
**Dependency:** Activity Tracker, Habits, Goals, Money (read-only event source)

---

## 1. Architecture Overview

Achievements is a **read-only observer** module. It never writes back to source modules. Evaluation is triggered **in-process** (function call, not message queue) at each source module's write endpoints.

```
Source module write endpoint
  └→ AchievementService.evaluate(userId, event)
       └→ Rule engine: match requirement_type → UPSERT user_achievements
            └→ If progress >= requirement_value → set unlocked_at
```

The rule engine is synchronous and idempotent (UPSERT by `user_id + achievement_id`).

## 2. Data Layer

### Drizzle Schema — `achievements.ts`

Two tables, added to `server/src/drizzle/schema/` and re-exported from `index.ts`.

**achievement_definitions** (master data, not per-user):
- `id` — TEXT UUID PK
- `title` — TEXT NOT NULL
- `description` — TEXT NOT NULL
- `requirement_type` — TEXT NOT NULL (enum string, validated in service)
- `requirement_value` — REAL NOT NULL
- `icon` — TEXT NOT NULL (badge icon identifier, maps to a claymorphism badge design)
- `category` — TEXT NOT NULL
- `created_at` — TEXT NOT NULL ISO 8601

**user_achievements** (per-user progress):
- `id` — TEXT UUID PK
- `user_id` — TEXT FK → users.id (ON DELETE CASCADE)
- `achievement_id` — TEXT FK → achievement_definitions.id (ON DELETE CASCADE)
- `progress` — REAL NOT NULL DEFAULT 0
- `unlocked_at` — TEXT nullable ISO 8601
- `created_at` — TEXT NOT NULL
- `updated_at` — TEXT NOT NULL
- UNIQUE(user_id, achievement_id)

### Seed Data

Achievement definitions seeded at migration time (not user-facing CRUD). Seed file at `server/src/modules/achievements/seed.ts` with ~15–20 achievements across categories:

| Category | Examples | Requirement Types |
|---|---|---|
| activity | First session, 10h tracked, 100h tracked | `total_hours_tracked`, `sessions_completed` |
| habits | First habit done, 7d streak, 30d streak | `streak_days`, `habit_completions` |
| goals | First goal completed, 5 goals completed | `goal_completed` |
| planner | First event completed, 50 events completed | `planner_events_completed` |
| money | First budget kept, 3 budgets kept in row | `budget_kept` |
| loyalty | Used for 30 days, 100 days | `days_active` |

> `ponytail: ~20 achievements covers all categories; add more when user engagement data shows which categories resonate most.`

## 3. Backend Module

### File Structure

```
server/src/modules/achievements/
├── achievements.module.ts       // NestJS module
├── achievements.controller.ts   // REST endpoints
├── achievements.service.ts      // Business logic + rule engine
├── achievements.gateway.ts      // Event listener integration hook
├── seed.ts                      // Achievement definitions seed data
└── dto/
    ├── index.ts                 // Barrel export
    └── achievements.dto.ts      // Response + evaluate DTOs
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/achievements` | All definitions + user progress (joins both tables) |
| GET | `/achievements/unlocked` | Filtered to unlocked only |
| GET | `/achievements/:id` | Single achievement with progress |
| POST | `/achievements/evaluate` | Internal — called by event hooks |

### Controller Pattern

Follows habits controller exactly:
- `@Controller('achievements')`
- `@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))`
- `DEFAULT_USER_ID = 'default'`

### Rule Engine (`AchievementsService.evaluate`)

```
evaluate(userId, eventType, eventValue):
  1. Find all achievement_definitions where requirement_type matches eventType
  2. For each:
     a. UPSERT user_achievement:
        INSERT ... ON CONFLICT(user_id, achievement_id) DO UPDATE
        SET progress = MAX(progress, eventValue)  -- for cumulative types
        OR SET progress = progress + eventValue    -- for incremental types
     b. If progress >= requirement_value AND unlocked_at IS NULL:
        SET unlocked_at = NOW()
  3. Return list of newly-unlocked achievement IDs (for UI toast)
```

**Requirement type classification:**
- **Cumulative** (`total_hours_tracked`, `habit_completions`, `days_active`): progress = MAX(progress, eventValue) — event carries the total
- **Incremental** (`sessions_completed`, `planner_events_completed`): progress = progress + eventValue — event carries delta
- **Threshold** (`streak_days`, `budget_kept`): progress = MAX(progress, eventValue) — event carries current streak/budget count

### Event Hooks

Called from source module write endpoints. Implementation pattern:

```typescript
// In achievements.gateway.ts
class AchievementsEventGateway {
  constructor(private achievementsService: AchievementsService) {}
  
  async onActivitySessionCompleted(userId: string, durationMinutes: number, totalHours: number) {
    await this.achievementsService.evaluate(userId, 'total_hours_tracked', totalHours);
    await this.achievementsService.evaluate(userId, 'sessions_completed', 1);
  }
  
  async onHabitLogged(userId: string, streakDays: number, totalCompletions: number) {
    await this.achievementsService.evaluate(userId, 'streak_days', streakDays);
    await this.achievementsService.evaluate(userId, 'habit_completions', totalCompletions);
  }
  
  async onGoalCompleted(userId: string, totalGoals: number) {
    await this.achievementsService.evaluate(userId, 'goal_completed', totalGoals);
  }
  
  async onBudgetPeriodClosed(userId: string, kept: boolean, consecutiveKept: number) {
    if (kept) await this.achievementsService.evaluate(userId, 'budget_kept', consecutiveKept);
  }
  
  async onPlannerEventCompleted(userId: string, totalCompleted: number) {
    await this.achievementsService.evaluate(userId, 'planner_events_completed', totalCompleted);
  }
}
```

### Module Registration

`AchievementsModule` imports nothing from other modules (it receives event calls, doesn't depend on them). It exports `AchievementsEventGateway` so source modules can inject it.

## 4. Frontend

### File Structure

```
client/src/
├── api/achievements.ts              // API client
├── pages/Achievements.tsx           // Main achievements page
├── components/achievements/
│   ├── AchievementCard.tsx          // Single badge card (claymorphism)
│   ├── AchievementGrid.tsx          // Grid layout with category filter
│   ├── AchievementProgress.tsx      // Progress ring + requirement label
│   └── AchievementsHeader.tsx       // Level badge + total unlocked count
└── types/achievements.ts            // Shared types
```

### API Client Pattern

`client/src/api/achievements.ts` — follows existing API client convention (see `analytics.ts` for reference):
- `getAchievements()` → `GET /achievements`
- `getUnlocked()` → `GET /achievements/unlocked`
- `getAchievement(id)` → `GET /achievements/:id`

### Page Layout

```
┌─────────────────────────────────────────────────────┐
│  🏆 Achievements                  [User Level: 5]   │
│  12 / 20 unlocked                                   │
├─────────────────────────────────────────────────────┤
│  [All] [Activity] [Habits] [Goals] [Planner] [Money]│  ← category filter tabs
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ ⭐ 10h   │ │ ⭐ 50h   │ │ 🔒 100h  │            │  ← clay card grid
│  │ Tracked  │ │ Tracked  │ │ Tracked  │            │
│  │ 10/10 ✔  │ │ 34/50 ▓  │ │ ???/100  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 🔒 7d    │ │ 🔒 30d   │ │ 🔒 Streak │            │
│  │ Streak   │ │ Streak   │ │ Master   │            │
│  │ ???      │ │ ???      │ │ ???      │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

### UI States per Achievement Card

| State | Visual | Elements |
|---|---|---|
| **Unlocked** | Full-color clay card, badge icon in color | Badge emoji, title, description visible, "Unlocked" label + date, subtle glow/shadow |
| **Locked w/ progress** | Semi-transparent, progress ring visible | Grayscale badge icon, title visible, description visible, `progress/requirement` label, progress ring |
| **Locked w/o progress** | Muted clay card, silhouette badge | Grayscale icon, title visible, description hidden ("???"), "Start to discover" label |

### Level System

Calculated client-side from total unlocked count:
- Level = `floor(totalUnlocked / 3) + 1`
- Displayed in header as a claymorphism badge with level number

## 5. UI/UX Design — Claymorphism

Uses existing design system:
- `Card` (level 1 for grid cards, level 2 for header)
- `ProgressRing` for progress display on locked cards
- `Badge` for category tags
- `ClayInput` pattern for any filter/search

Claymorphism tokens already active via CSS custom properties:
- `--clay-shadow-sm`, `--clay-shadow-md` for card elevation
- `rounded-[--radius-lg]` for large border radius on badges
- `bg-clay-surface`, `clay-l1`, `clay-l2` for material feel
- Soft inner shadow on pressed state for interactivity

No new design dependencies needed.

## 6. Integration Points

### Activity Tracker Hook
After `POST /activity/sessions/stop` → `gateway.onActivitySessionCompleted()`

### Habits Hook
After `POST /habits/:id/log` → `gateway.onHabitLogged()`

### Goals Hook
After milestone completion that triggers goal completion → `gateway.onGoalCompleted()`

### Money Hook
After budget period auto-closed (scheduler or manual) → `gateway.onBudgetPeriodClosed()`

### Planner Hook
After planner event marked completed → `gateway.onPlannerEventCompleted()`

> **Note:** Hooks are added to existing source modules' write endpoints. Each hook is a single function call. If a source module write endpoint already exists, we add one line to call the gateway after the write succeeds.

## 7. Non-Functional Requirements

- **Idempotency:** UPSERT pattern ensures double evaluation from retry/kill produces no duplicates
- **Performance:** Rule engine iterates only matching definitions (filtered by `requirement_type`). Under 10ms per evaluate call for ~5 matching definitions.
- **Seed data stability:** `achievement_definitions` is write-once at migration. No user-facing mutation endpoints.
- **Cold start:** All achievements fetched in one query (JOIN definitions + user_achievements). Sub-100ms on SQLite with index on `(user_id, achievement_id)`.

## 8. Non-Goals

- No notification system beyond UI display (push notifications out of scope)
- No achievement animation framework (CSS transitions only)
- No user-created achievements (spec explicitly says definitions are seed-only)
- No leaderboards or social features (single-user app)

## 9. Migration Plan

1. Add `achievement_definitions` + `user_achievements` tables via Drizzle migration
2. Seed achievement definitions in the migration
3. Build NestJS module (schema → DTOs → service → controller → event gateway)
4. Register module in `AppModule`
5. Build React page (API client → types → components → page → route)
6. Add event hooks to source module write endpoints
7. End-to-end test: trigger source event → verify achievement unlocks
