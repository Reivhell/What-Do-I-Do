# Phase 4: Scaling Infrastructure + Dashboard — Execution Design

> **Date**: 2026-07-15
> **Context**: `18-scaling-notes.md` — local-first SQLite scaling + Dashboard completion in Phase 4 (Insight Layer)
> **Files referenced**: `00-architecture.md`, `01-dashboard.md`, `10-analytics.md`, `11-statistics.md`, `16-database-schema.md`, `18-scaling-notes.md`, `design.md`

## Problem

`18-scaling-notes.md` defines the simplified scaling model for local-first SQLite: scheduled snapshots via `node-cron`, lazy cache invalidation, no Redis/BullMQ. The server implementation is **partially done** — scheduler/snapshot/score-calculator exist, but:

1. **Dashboard endpoint missing** — `server/src/modules/dashboard/` has only `.gitkeep`
2. **Cache invalidation unwired** — `StatisticsService.invalidate()` exists but domain services don't call it
3. **Dashboard hardcoded** — layout is claymorphism but data is fake
4. **Analytics/Statistics/Insights pages** — functional but not styled to `design.md` claymorphism spec

## Architecture (Parallel Build)

### Target State

```
Domain Services (activity, money, habits, goals, tasks)
  └→ invalidateStatisticsCache() on every write
  └→ achievement rule evaluation on relevant writes
  └→ (all in-process function calls, no event bus)

AnalyticsScheduler (node-cron, in-process)
  └→ Daily snapshot @ 01:00
  └→ Chain weekly/monthly/yearly as direct calls
  └→ Then: generate insights

DashboardService (NEW)
  └→ GET /dashboard/summary → one composed response
  └→ Reads from all domain services in parallel

Dashboard.tsx (wired to real data)
  └→ Keep current claymorphism layout
  └→ Replace hardcoded values with API calls
  └→ Add: upcoming events, habit progress, discipline score, insight card, planned-vs-actual
```

### Shared Contract — `DashboardSummary`

New type in `shared/src/types/`:

```ts
interface DashboardSummary {
  activeSession: {
    isActive: boolean;
    activityName?: string;
    elapsedSeconds?: number;
    sessionId?: string;
  } | null;
  todayStats: {
    tasksCompleted: number;
    tasksTotal: number;
    minutesTracked: number;
    expenseToday: number;
    incomeToday: number;
    habitsDone: number;
    habitsTotal: number;
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    time: string;
    duration?: number;
  }>;
  scores: {
    discipline: number | null;
    focus: number | null;
    consistency: number | null;
  };
  topInsight: { message: string; type: string; } | null;
  streak: { current: number; best: number; };
}
```

### Design Tokens (from `design.md`)

| Token | Value | Applied to |
|---|---|---|
| `--clay-bg` | `#F4F7FB` | Page backgrounds |
| `--clay-surface` | `#FFFFFF` | Card/panel surfaces |
| `--radius-lg` | `28px` | All card containers |
| `clay-l1` shadow | `6px 6px 12px dark, -6px -6px 12px light` | Default cards |
| `--blue-500` | `#3977D4` | Primary accent |

All existing `Card`/`Button`/`Badge` components are already claymorphism — design pass ensures Analytics/Statistics/Insights pages use them consistently.

## Execution: 3 Parallel Agents

### Agent 1 — BE Core
**Type**: `general-purpose`
**Scope**: New dashboard module + cache invalidation wiring
**Creates**:
- `server/src/modules/dashboard/dashboard.service.ts` — `getSummary()` with parallel queries
- `server/src/modules/dashboard/dashboard.controller.ts` — `GET /dashboard/summary`
- `server/src/modules/dashboard/dashboard.module.ts`

**Modifies**:
- Domain services (`server/src/modules/money/`, `activity-tracker/`, `habits/`, `goals/`, `tasks/`) — call `StatisticsService.invalidate()` after write
- Domain services — call achievement evaluation after relevant writes
- `server/src/app.module.ts` — register DashboardModule

### Agent 2 — FE Dashboard
**Type**: `general-purpose`
**Scope**: Wire Dashboard.tsx to real data, add missing widgets
**Creates**:
- `shared/src/types/dashboard.ts` — `DashboardSummary` interface
- `client/src/api/dashboard.ts` — `useDashboardSummary()` hook

**Modifies**:
- `client/src/pages/Dashboard.tsx` — replace hardcoded values, add:
  - Real active session timer from API
  - Today stats (tasks, time, money, habits)
  - Upcoming events from planner
  - Discipline/focus/consistency scores
  - Top insight widget
  - Planned-vs-actual section (if data available)
  - Habit progress cards
- `shared/src/index.ts` — export new types

### Agent 3 — Design Polish
**Type**: `impeccable`
**Scope**: Apply claymorphism tokens to remaining pages
**Modifies**:
- `client/src/pages/Analytics.tsx` — use `Card` components, apply `design.md` tokens
- `client/src/pages/Statistics.tsx` — use `Card` components, apply `design.md` tokens
- `client/src/pages/Insights.tsx` — use `Card` components, apply `design.md` tokens
- Any UI drift fixes found during pass

### Skills & Tools

| Skill/Tool | Phase | Purpose |
|---|---|---|
| `context7` MCP | BE Core | Drizzle ORM patterns if needed |
| `impeccable` skill | Agent 3 | Precise claymorphism token application |
| `ponytail` approach | All | Shortest working diff, reuse existing patterns |
| `code-review` skill | Post-build | Review all changes for correctness |
| `verify` skill | Post-build | End-to-end: run app, check Dashboard renders real data |
| `graphify update` | Final | Keep knowledge graph current |

## Ordering & Dependencies

```
Phase 1 — Prep: Define DashboardSummary type in shared
  │
  ├─► Agent 1 (BE)     ◄── Agent 2 needs type (defined in Phase 1)
  ├─► Agent 2 (FE)     ◄── Needs DashboardSummary type + dashboard endpoint (Agent 1)
  └─► Agent 3 (Design) ◄── Independent — can start immediately on Analytics/Statistics/Insights pages
       │
Phase 3 — Integration (after all agents complete)
  ├── Code review
  ├── Verify end-to-end
  └── Fix any issues

Phase 4 — Ship
  ├── graphify update .
  └── Commit
```

**Note**: Agent 2 needs Agent 1's dashboard endpoint to wire real data. Workflow handles this as pipeline: Agent 1 completes → Agent 2 starts. Agent 3 runs independently from the start.

## Self-Review

- ✅ No placeholders or TBD
- ✅ Architecture matches existing patterns (parallel queries, same as `StatisticsService.getAll()`)
- ✅ Scope is focused: Dashboard completion + scaling infra only
- ✅ No ambiguity: DashboardSummary contract is explicit
- ✅ Ponytail-aligned: reuse existing Card/Button/Badge components, no new abstractions
