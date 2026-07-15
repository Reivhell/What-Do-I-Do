# Multi-Agent Orchestration: Database Schema Integration & Claymorphism UI Refinement

> **Date**: 2025-07-15
> **Project**: What Do I Do — Personal Life Management App
> **Task source**: `task/16-database-schema.md` (SQLite DDL via Drizzle ORM)
> **Framework**: Ponytail (lazy/lean development)
> **Context7**: Documentation references for Drizzle ORM patterns

---

## 1. Executive Summary

Translate the DDL document (`16-database-schema.md`) into full implementation across the existing codebase. The schema is already 85% implemented; remaining work consists of:

- Adding missing DB-level CHECK constraints for enum fields
- Adding missing indexes from the DDL's index summary
- Implementing SQLite `updated_at` triggers as custom migration SQL
- Refining client-side claymorphism UI to match `design.md` token spec
- Completing a few untracked files (settings API, shared types)

Orchestration follows a **hybrid pipeline** model: **Discover → Fan-Out → Verify** — maximizing parallel worktree-isolated agents while using a discovery phase to prevent unnecessary work.

---

## 2. Current State Assessment

### Schema Status (15 tables across 16 schema files)

| Module | Schema File | Missing CHECK | Missing Index | Notes |
|--------|------------|--------------|---------------|-------|
| users | `users.ts` ✓ | none | none | Drizzle doesn't enforce email format at DB level (intentional) |
| inbox | `inbox.ts` ✓ | `status IN ('unprocessed','processed','archived')` | ✓ `(user_id, status)`, ✓ `(user_id, created_at)` | tags as JSON ✓ |
| tasks | `tasks.ts` ✓ | `status IN (...)`, `priority IN ('low','medium','high')` | ✓ `(user_id, created_at)`, ✓ `(user_id, status, due_date)` | Missing `source_type` column for polymorphic source |
| planner | `planner.ts` ✓ | `priority IN (...)`, `status IN (...)`, `source_type IN (...)`, `end_time > start_time` | need `(user_id, date)` | Missing `refresh_token` column |
| activity-tracker | `activity-tracker.ts` ✓ | `source IN ('live','manual')` | need `(user_id, created_at)` | — |
| habits | `habits.ts` ✓ | `target_frequency IN (...)`, `habit_logs.status IN ('done','skipped','missed')` | ✓ `(user_id, created_at)`, ✓ `(habit_id, date)` | — |
| goals | `goals.ts` ✓ | `status IN ('active',...)` | none explicit | milestone `generated_event_id` FK to planner ✓ |
| money | `money.ts` ✓ | `accounts.type IN (...)`, `transactions.type IN (...)`, `recurring_bills.status`, `budgets.amount_limit > 0` | ✓ all three indexes | transfer atomicity needed in service layer |
| life-log | `life-log.ts` ✓ | none | need `(user_id, timestamp)` | — |
| analytics | `analytics.ts` ✓ | none | ✓ unique composite | — |
| statistics | `statistics.ts` ✓ | `scope IN (...)`, `data` JSON type | ✓ unique scope | — |
| achievements | `achievements.ts` ✓ | none | ✓ unique user+achievement | — |
| insights | `insights.ts` ✓ | `type IN (...)`, `severity IN (...)` | ✓ unique active index | — |
| workspace | `workspace.ts` ✓ | none | ✓ unique active + `(user_id, created_at)` | Migration 0009 exists |
| settings | `settings.ts` ✓ | none | none needed | Untracked client API files |

### Client Status

- All 14 pages exist under `client/src/pages/`
- All 14 API modules exist under `client/src/api/`
- UI components: Button, Card (claymorphism-enabled), Badge, Input, Modal, ProgressBar, ProgressRing, Toggle, EmptyState, Select (new/untracked)
- Design system: `design.md` defines claymorphism tokens — partially applied in Card, not yet in all widgets

---

## 3. Architecture

### 3.1 Phase Flow

```ascii
┌─────────────────────────────────────────────────────────────────────┐
│                          PHASE 1: DISCOVERY                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Explore Agent (read-only)                                   │   │
│  │  • Compare 16-database-schema.md vs each schema.ts           │   │
│  │  • Map DDL tables → schema files → service layers → API      │   │
│  │  • Identify missing CHECK, INDEX, TRIGGER, COLUMN            │   │
│  │  • Output: gap-report.json (structured)                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │ gap report
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PHASE 2: FAN-OUT (parallel)                   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Core     │  │Habit+Goal│  │ Money    │  │ Dashboard│           │
│  │ Worktree │  │Worktree  │  │ Worktree │  │+UI       │           │
│  │          │  │          │  │          │  │Worktree  │           │
│  │• users   │  │• habits  │  │• accounts│  │• Card    │           │
│  │• inbox   │  │• logs    │  │• transxn │  │• Button  │           │
│  │• tasks   │  │• goals   │  │• budgets │  │• Badge   │           │
│  │• planner │  │• stones  │  │• bills   │  │• tokens  │           │
│  │• activity│  │          │  │          │  │• bento   │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ┌──────────┐  ┌──────────┐                                         │
│  │Analytics │  │Peripheral│                                         │
│  │Worktree  │  │Worktree  │                                         │
│  │          │  │          │                                         │
│  │• snapsht │  │• settings│                                         │
│  │• cache   │  │• achvmts │                                         │
│  │• life-log│  │• wrkspce │                                         │
│  │• insights│  │• shared  │                                         │
│  └──────────┘  └──────────┘                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │ all changes verified
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PHASE 3: VERIFICATION                         │
│                                                                     │
│  Per-worktree adversarial review → cross-domain integration review  │
│  → build check → test run → merge worktrees → graphify update       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Agent & Tool Mapping

| Phase | Agent Type | Tools/Skills | Purpose |
|-------|-----------|-------------|---------|
| 1 | Explore (read-only) | Graph, Read, Grep, Glob, Context7 MCP | Audit schema vs DDL |
| 2.1-2.3, 2.5-2.6 | feature-dev:code-explorer + feature-dev:code-architect | Read, Write, Edit, LSP, Context7 MCP | Apply schema + service fixes per domain |
| 2.4 | feature-dev + impeccable:impeccable-manual-edit-applier | Read, Write, Edit, Impeccable MCP | Claymorphism CSS refinement, widget layout |
| 3 | code-reviewer | Read, Grep, LSP, Glob | Adversarial verification per worktree |
| All | ponytail:ponytail (active session mode) | N/A (behavioral) | Enforce lazy-minimal patterns |

---

## 4. Detailed Execution Roadmap

### Phase 1: Discovery (single agent, ~5 min)

**Step 1.1 — Refresh knowledge graph**
```bash
cd /path/to/project && graphify update .
```

**Step 1.2 — Run audit agent**
Spawn `Explore` subagent with structured JSON Schema output:
```json
{
  "type": "object",
  "properties": {
    "gaps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "table": "string",
          "file": "string",
          "missingCheck": "string[]",
          "missingIndex": "string[]",
          "missingColumn": "string[]",
          "missingTrigger": "boolean",
          "notes": "string"
        }
      }
    },
    "apiGaps": { "type": "array" }
  }
}
```

**Step 1.3 — Fetch Drizzle docs (if needed)**
Use Context7 MCP: `resolve-library-id` for `drizzle-orm` → `query-docs` for SQLite-specific patterns (CHECK constraints, custom migrations for triggers)

**Gate**: Gap report reviewed. If empty, skip Phase 2 (no changes needed).

### Phase 2: Fan-Out (6 parallel worktree agents, ~15-20 min)

**Setup**: Run once before fan-out:
```bash
git worktree add .claude/worktrees/core HEAD
git worktree add .claude/worktrees/habits-goals HEAD
git worktree add .claude/worktrees/money HEAD
git worktree add .claude/worktrees/dashboard-ui HEAD
git worktree add .claude/worktrees/analytics HEAD
git worktree add .claude/worktrees/peripheral HEAD
```

**Worktree 1 — Core (users, inbox, tasks, planner, activity-tracker)**
- Files: `server/src/drizzle/schema/{users,inbox,tasks,planner,activity-tracker}.ts`
- Changes:
  - Add `status IN (...)`, `priority IN (...)` CHECK constraints using `text({enum:[...], mode:'json'})` or Drizzle `$default`
  - Add `idx_planner_events_user_date`, `idx_activity_sessions_user_created_at` indexes
  - Add missing `source_type` column to tasks (DDL defines `source_type IN ('manual','task','habit','goal_milestone')`)
  - Create custom migration SQL for `updated_at` triggers per table
  - Verify FK callbacks follow `(): AnySQLiteColumn` pattern

**Worktree 2 — Habits+Goals**
- Files: `server/src/drizzle/schema/{habits,goals}.ts`, `server/src/modules/{habits,goals}/`
- Changes:
  - Add CHECK constraints for `target_frequency`, `habit_logs.status`, `goals.status`
  - Ensure `linkedGoalId` FK references use callback pattern

**Worktree 3 — Money**
- Files: `server/src/drizzle/schema/money.ts`, `server/src/modules/money/`
- Changes:
  - Add CHECK for `accounts.type`, `transactions.type`, `recurring_bills.status`
  - Add `amount_limit > 0` CHECK for budgets
  - Verify transfer atomicity documented in `money.service.ts`

**Worktree 4 — Dashboard + UI**
- Files: `client/src/components/ui/{Card,Button,Badge,Input,ClayInput,Select}.tsx`, `client/src/pages/Dashboard.tsx`, `client/src/styles/`
- Changes:
  - Audit every claymorphism CSS property against `design.md` tokens (14 token variables)
  - Replace inline shadow values with `clay-level-1`/`clay-level-2` CSS classes
  - Ensure `clay-pressed` class used on interactive elements (buttons in Dashboard.tsx)
  - Apply `clay-surface-alt` for nested card surfaces
  - Integrate new `Select.tsx` into UI index (already untracked new file)
  - Verify dark mode: token mapping must define dark variants for every clay token
  - Bent grid layout: ensure widget cards use CSS grid with proper `--radius-*` values

**Worktree 5 — Analytics Cluster**
- Files: `server/src/drizzle/schema/{analytics,statistics,life-log,insights}.ts`
- Changes:
  - Verify `analytics_snapshots` unique index: `(user_id, period_type, period_start)`
  - Ensure `statistics_cache.scope` enum: `overall|time|activity|money|habit|goal`
  - Verify `insights.type` and `insights.severity` CHECK constraints

**Worktree 6 — Peripheral**
- Files: `server/src/drizzle/schema/{settings,achievements,workspace}.ts`, `client/src/api/settings.ts`, `shared/src/types/settings.ts`
- Changes:
  - Verify `layoutPresets` partial index (already migration 0009)
  - Integrate new `settings.ts` (client API) into api index
  - Integrate new `settings.ts` (shared types) into shared index
  - Ensure `userPreferences`, `notificationSettings` have all columns from DDL

### Phase 3: Verification (2-3 agents, ~10 min)

**Step 3.1 — Per-worktree adversarial review**
Spawn `code-reviewer` agent per worktree:
- Set `effort: "high"` for Money and Core worktrees (financial data integrity)
- Set `effort: "medium"` for others

**Step 3.2 — Cross-domain integration review**
One agent reviews all changes together, focusing on:
- FK chain integrity across worktrees
- API endpoint consistency (request/response shapes match shared types)
- No duplicate migrations

**Step 3.3 — Build verification**
```bash
cd /path/to/project/main
npm run build  # runs tsc on server + client
```

**Step 3.4 — Migration generation**
```bash
cd /path/to/project
npx drizzle-kit generate
```

**Step 3.5 — Test run**
```bash
cd /path/to/project
npm test
```

**Step 3.6 — Merge worktrees**
```bash
cd /path/to/project
for w in core habits-goals money dashboard-ui analytics peripheral; do
  cd .claude/worktrees/$w
  git add -A && git commit -m "..."
  cd /path/to/project/main
  git merge .claude/worktrees/$w --no-ff -m "..."
done
```

**Step 3.7 — Update graph**
```bash
graphify update .
```

---

## 5. Claymorphism UI Specification

### 5.1 CSS Custom Properties (from `design.md`)

```css
:root {
  --clay-bg: #F4F7FB;
  --clay-surface: #FFFFFF;
  --clay-surface-alt: #FAFCFE;
  --clay-shadow-light: #FFFFFF;
  --clay-shadow-dark: #D1D9E6;
  --radius-sm: 14px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --radius-xl: 36px;
  --radius-pill: 999px;
}

.clay-level-1 {
  box-shadow: 6px 6px 12px var(--clay-shadow-dark), -6px -6px 12px var(--clay-shadow-light);
}
.clay-level-2 {
  box-shadow: 10px 10px 20px var(--clay-shadow-dark), -8px -8px 18px var(--clay-shadow-light);
}
.clay-pressed {
  box-shadow: inset 4px 4px 8px var(--clay-shadow-dark), inset -4px -4px 8px var(--clay-shadow-light);
}
```

### 5.2 Dark Mode Mapping

```css
[data-theme="dark"] {
  --clay-bg: #1a1d23;
  --clay-surface: #24272e;
  --clay-surface-alt: #2a2d35;
  --clay-shadow-light: #2d3038;
  --clay-shadow-dark: #0d0f12;
}
```

### 5.3 Component Audit Checklist

| Component | Current State | Required Change |
|-----------|--------------|----------------|
| Card.tsx | Uses `clay-l1`/`clay-l2` classes ✓ | Verify class names match design.md |
| Button.tsx | Needs `clay-pressed` on active | Add pressed state |
| Dashboard.tsx | Inline shadows in quick-actions | Replace with CSS var classes |
| Badge.tsx | Flat style | Add `clay-level-1` for raised badges |
| Input.tsx / ClayInput.tsx | Need clay surface styling | Add `clay-surface` background |
| WidgetCard.tsx (dashboard) | Custom styles | Use Card component with level prop |

---

## 6. Constraints & Edge Cases

### 6.1 Ponytail Ceilings (documented simplifications)

| Ceiling | What's Simplified | Upgrade Path |
|---------|------------------|-------------|
| `CHECK` constraints via Drizzle `enum` | DB-level CHECK not generated automatically by DrizzleKit from `text({enum:[...]})` — only TS-level enforcement | Custom migration SQL for critical CHECK constraints, or wait for DrizzleKit to support CHECK generation |
| `updated_at` triggers | Written as custom SQL in migration files, not auto-generated | DrizzleKit custom migration file patching |
| Transfer atomicity | DB transaction in service layer | Would need distributed tx if scaling to multi-DB |

### 6.2 Known Risks

| Risk | Mitigation |
|------|-----------|
| Circular FK in planner ↔ activity_sessions | Use `(): AnySQLiteColumn` callback pattern in Drizzle; run all migrations in one batch |
| Parallel worktree merge conflicts | Sequential merge order; Graphify update only after all merge |
| DrizzleKit CHECK generation gap | Document in gap report; implement CHECK as custom SQL only on critical fields |
| Settings.ts untracked files overlap | Coordinate between Worktree 6 and Phase 1 discovery |

---

## 7. Verification Criteria

- [ ] All 15 schema files compile with `drizzle-kit generate` producing valid SQL
- [ ] `npm run build` passes for server + client
- [ ] Existing tests pass
- [ ] Dashboard renders with claymorphism tokens (not inline shadows)
- [ ] All 14 client pages still load without JS errors
- [ ] Card, Button, Badge components use `design.md` CSS custom props
- [ ] Dark mode has explicit clay shadow mapping
- [ ] Graphify graph updated and consistent
- [ ] Gap report items resolved or documented as intentional
