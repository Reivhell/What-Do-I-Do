# Statistics Module Completion — Records View & Cache Invalidation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Ponytail note:** This is a *completion* plan, not a from-scratch build. The Statistics module is ~90% done (schema, 6 scopes, cache, lazy invalidation, 6-tab claymorphism UI all exist). Only the gaps below are planned. Every code step is the minimum change; reuse-first, no new abstractions.

**Goal:** Complete the Statistics module per `task/11-statistics.md` by adding the mandated **Records** view (`GET /statistics/records`) and closing two cache-invalidation gaps (Tasks + Milestones writes).

**Architecture:** Reuse the existing `StatisticsService.getAll()` to derive Records (no recomputation — ponytail rule #2). Add a `records` scope only as an API/UI concern; the cache stores per-scope so Records reads from already-cached scope data. Lazy invalidation (spec §"Catatan Implementasi") is extended to Tasks and Milestone write paths, matching the pattern already present in activity/money/habits/goals services.

**Tech Stack:** NestJS (controller/service), Drizzle ORM over SQLite, `@whatdo/shared` types, React + TanStack Query client, existing `ui/` claymorphism components. Context7 used for exact current Drizzle/`sql` aggregation + React Query v5 API.

## Global Constraints

Copied verbatim from `task/11-statistics.md` and `claude.md`:

- **API outline (exact):** `GET /statistics/overall`, `/time`, `/activity`, `/money`, `/habit`, `/goal`, `/records`. The spec lists `/records` → "semua biggest/longest/best dalam satu response". **This endpoint does not yet exist — must be added.**
- **Cache pattern — lazy, in-process:** "Saat ada write ke activity_sessions/transactions/habit_logs/goals/milestones, panggil `invalidateStatisticsCache(user_id, scope)` in-process (function call langsung di request handler yang sama) → hapus row cache → request GET berikutnya cache miss → compute → simpan lagi." Must hold for **milestones** and **tasks** writes too.
- **No MATERIALIZED VIEW:** "SQLite tidak punya MATERIALIZED VIEW … Solusi benar: `statistics_cache`." Do not add a SQLite view. Cache table `statistics_cache` already exists.
- **Scannable layout:** "angka besar, label singkat, bukan paragraf." Records UI must use the existing `Card level={1}` + `font-display` big-number pattern.
- **Claymorphism tokens only:** All visuals use tokens from `design.md` (`--clay-bg`, `--clay-surface`, `--blue-50..500`, `clay-level-1/2`). No ad-hoc hex.
- **Single-user:** `DEFAULT_USER_ID = 'default'` already used by controller; no auth/multi-tenant.

---

## Multi-Agent Orchestration Strategy (explicit requirement)

Execute via `superpowers:subagent-driven-development`. Coordinator = main session (this plan's author); it dispatches one fresh subagent per task group, reviews the diff after each, then advances. Parallelizable groups run concurrently; dependent groups wait.

### Sub-agent structure

| Agent | Type | Scope | Depends on |
|---|---|---|---|
| **A — Backend Records** | `general-purpose` (or `feature-dev:code-architect` for review) | Task 1–3: shared types, `getRecords()`, controller route | — |
| **B — Frontend Records UI** | `general-purpose` | Task 4–5: client hook `useRecordsStats`, 7th `records` tab | A (types + endpoint live) |
| **C — Cache Invalidation Fix** | `general-purpose` | Task 6–7: wire Tasks + Milestone writes to `invalidate()` | — (independent of A/B) |
| **D — Claymorphism Audit (Impeccable)** | `impeccable:impeccable` skill / `impeccable-manual-edit-applier` | Task 8: design-token consistency pass on `Statistics.tsx` against `design.md` | B (UI final) |
| **E — Verify & Screenshot** | `verify` skill + `chrome-devtools-mcp` | Task 9: boot server, curl all 7 endpoints, screenshot Records tab | A,B,C,D |

**Concurrency:** A, C run in parallel (Task 1–3 and Task 6–7 independent). B starts after A. D after B. E last, end-to-end.

### Skills & MCP leverage (explicit requirement)

| Skill / MCP | Where used | Purpose |
|---|---|---|
| `superpowers:writing-plans` | this document | plan structure, bite-sized tasks, self-review |
| `superpowers:subagent-driven-development` | execution | per-task agent dispatch + two-stage review |
| `superpowers:verification-before-completion` / `verify` | Task 9 | exercise endpoints + UI end-to-end before done |
| `context7` | Task 1, 3, 4 | pull *current* Drizzle `sql` aggregation + TanStack Query v5 `useQuery` API (avoid stale training syntax) |
| `impeccable:impeccable` | Task 8 | high-fidelity claymorphism audit/apply on `Statistics.tsx` |
| `chrome-devtools-mcp` | Task 9 | screenshot Records tab, confirm clay shadows render |
| `feature-dev:code-reviewer` (optional) | after A | second-opinion review of `getRecords` reuse logic |
| `ponytail:ponytail` | all tasks | enforce minimum-diff, reuse-first, no over-build |

### Context7 usage (explicit requirement)

- **Task 1/3:** `context7` query → *Drizzle ORM sqlite `sql` template / `sum` `max` aggregation* — confirm `sql<number>\`sum(${col})\`` + `.get()` is current API for the Records derivation (we reuse `getAll`, so this is a sanity check, not new query authoring).
- **Task 4:** `context7` query → *TanStack Query v5 `useQuery` object syntax* — confirm `queryKey`/`queryFn`/`staleTime` shape matches existing `client/src/api/statistics.ts` (mirror it 1:1).
- No new library installed (ponytail rule #5). Context7 is read-only reference.

---

## File Structure

- Modify: `shared/src/types/statistics.ts` — add `RecordItem`, `RecordsStats`.
- Modify: `server/src/modules/statistics/statistics.service.ts` — add `getRecords()` (reuses `getAll`).
- Modify: `server/src/modules/statistics/statistics.controller.ts` — add `@Get('records')`.
- Modify: `client/src/api/statistics.ts` — add `useRecordsStats` hook.
- Modify: `client/src/pages/Statistics.tsx` — add 7th `records` tab + render.
- Modify: `server/src/modules/tasks/tasks.service.ts` — inject `StatisticsService`, invalidate on writes.
- Modify: `server/src/modules/goals/goals.service.ts` — invalidate on milestone create/update/delete/schedule.
- Audit (no logic change): `client/src/pages/Statistics.tsx` via Impeccable.

---

## Task 1: Shared types — `RecordItem` + `RecordsStats`

**Files:**
- Modify: `shared/src/types/statistics.ts`

**Interfaces:** Produces `RecordItem`, `RecordsStats` consumed by service (Task 3) and client (Task 4).

- [ ] **Step 1: Append record types to the shared file**

Add after `GoalStats` (end of file):

```ts
export type RecordScope = 'overall' | 'time' | 'activity' | 'money' | 'habit' | 'goal';

export interface RecordItem {
  label: string;
  value: string | number;
  display: 'text' | 'count' | 'minutes' | 'currency' | 'percent';
  sublabel?: string;
  scope: RecordScope;
}

export interface RecordsStats {
  records: RecordItem[];
}
```

- [ ] **Step 2: Type-check the shared package**

Run: `cd shared && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add shared/src/types/statistics.ts
git commit -m "feat(stats): add RecordItem/RecordsStats shared types"
```

---

## Task 2: Service — `getRecords()` reusing `getAll()`

**Files:**
- Modify: `server/src/modules/statistics/statistics.service.ts:1` (imports) and append method before `invalidate`.

**Interfaces:**
- Consumes: existing `getAll(userId, forceRefresh)` (returns `{overall,time,activity,money,habit,goal}`), `Scope` type.
- Produces: `getRecords(userId, forceRefresh?): Promise<RecordsStats>`.

- [ ] **Step 1: Add `RecordsStats` import**

Edit the type import block (top of file) to include the new type:

```ts
import type {
  OverviewStats, TimeStats, ActivityStats, ActivityStatEntry,
  MoneyStats, HabitStats, GoalStats, RecordsStats, RecordItem,
} from '@whatdo/shared';
```

- [ ] **Step 2: Add `getRecords()` method (reuse, no recompute — ponytail rule #2)**

Insert before `/* ── Cache invalidation` comment:

```ts
  async getRecords(userId: string, forceRefresh = false): Promise<RecordsStats> {
    const all = await this.getAll(userId, forceRefresh);
    const fmtMin = (m: number) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
    const records: RecordItem[] = [
      { label: 'Total Hours Tracked', value: all.time.totalHoursTracked, display: 'minutes', scope: 'time' },
      { label: 'Longest Session', value: all.time.longestSessionMinutes, display: 'minutes', scope: 'time' },
      { label: 'Most Frequent Activity', value: all.activity.mostFrequentActivity ?? '—', display: 'text', scope: 'activity' },
      { label: 'Biggest Income', value: all.money.biggestIncome?.amount ?? 0, display: 'currency', sublabel: all.money.biggestIncome?.date, scope: 'money' },
      { label: 'Biggest Expense', value: all.money.biggestExpense?.amount ?? 0, display: 'currency', sublabel: all.money.biggestExpense?.category, scope: 'money' },
      { label: 'Best Streak', value: all.habit.bestStreak, display: 'count', sublabel: `${all.habit.bestStreakHabitName ?? ''}`, scope: 'habit' },
      { label: 'Most Consistent Habit', value: all.habit.mostConsistentHabit?.name ?? '—', display: 'text', sublabel: all.habit.mostConsistentHabit ? `${all.habit.mostConsistentHabit.completionRate}%` : undefined, scope: 'habit' },
      { label: 'Completed Goals', value: all.goal.completedGoals, display: 'count', scope: 'goal' },
      { label: 'Completed Milestones', value: all.goal.completedMilestones, display: 'count', scope: 'goal' },
    ];
    return { records };
  }
```

> ponytail: derives entirely from cached `getAll()` — zero new SQL. If Records ever needs bespoke extremes not in the 6 scopes, add a dedicated query then.

- [ ] **Step 3: Type-check the server**

Run: `cd server && npx tsc --noEmit`
Expected: no errors (confirms `RecordItem`/`RecordsStats` resolve).

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/statistics/statistics.service.ts
git commit -m "feat(stats): add getRecords() derived from cached getAll()"
```

---

## Task 3: Controller — `GET /statistics/records`

**Files:**
- Modify: `server/src/modules/statistics/statistics.controller.ts:40` (after `getAll`).

**Interfaces:** Produces route consumed by client `useRecordsStats` (Task 4).

- [ ] **Step 1: Add the records route**

Insert after the `@Get('all')` block:

```ts
  @Get('records')
  getRecords(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getRecords(DEFAULT_USER_ID, forceRefresh === 'true');
  }
```

- [ ] **Step 2: Type-check + boot smoke**

Run: `cd server && npx tsc --noEmit && npm run start:dev` (or your dev script) — confirm it compiles.
Expected: compiles; endpoint registered at `/statistics/records`.

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/statistics/statistics.controller.ts
git commit -m "feat(stats): expose GET /statistics/records"
```

---

## Task 4: Client hook — `useRecordsStats`

**Files:**
- Modify: `client/src/api/statistics.ts`

**Interfaces:** Consumes `RecordsStats` from shared; produces hook used by `Statistics.tsx` (Task 5).

- [ ] **Step 1: Add import + hook (mirror existing hooks 1:1)**

Add `RecordsStats` to the shared import and append:

```ts
import type {
  OverviewStats, TimeStats, ActivityStats, MoneyStats,
  HabitStats, GoalStats, RecordsStats,
} from '@whatdo/shared';

export function useRecordsStats(forceRefresh?: boolean) {
  return useQuery<RecordsStats>({
    queryKey: ['statistics', 'records', { forceRefresh }],
    queryFn: () => request(buildUrl('/records', forceRefresh)),
    staleTime: 1000 * 60 * 5,
  });
}
```

- [ ] **Step 2: Type-check client**

Run: `cd client && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/api/statistics.ts
git commit -m "feat(stats): add useRecordsStats client hook"
```

---

## Task 5: UI — 7th `records` tab

**Files:**
- Modify: `client/src/pages/Statistics.tsx`

**Interfaces:** Consumes `useRecordsStats`, `RecordItem` type, existing `Card`/`Badge`/`EmptyState` UI.

- [ ] **Step 1: Add tab + icon**

In the `TABS` array, add after `goal`:

```ts
  { key: 'records', label: 'Records', icon: Award },
```

- [ ] **Step 2: Add `records` to the active-tab switch**

In the `renderTab()` switch (the `switch (activeTab)` block), add a `case 'records':` returning `<RecordsTab />`.

- [ ] **Step 3: Add `RecordsTab` component (reuses clay Card pattern)**

Append near other tab components:

```tsx
function RecordsTab() {
  const { data, isLoading, error } = useRecordsStats();
  if (isLoading) return <LoadingGrid />;
  if (error || !data) return <EmptyState icon={<Award className="size-8" />} title="No records" description="Records appear as you use the app." />;
  const fmt = (v: string | number, d: RecordItem['display']) => {
    if (d === 'text') return String(v);
    if (d === 'currency') return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v));
    if (d === 'minutes') return `${Math.floor(Number(v))}h`;
    if (d === 'percent') return `${v}%`;
    return String(v);
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.records.map((r) => (
        <Card level={1} key={r.label} className="p-5">
          <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">{r.label}</p>
          <p className="font-display text-3xl font-bold text-ink-900 mt-1">{fmt(r.value, r.display)}</p>
          {r.sublabel && <p className="font-body text-[13px] text-ink-400 mt-0.5">{r.sublabel}</p>}
          <Badge className="mt-2">{r.scope}</Badge>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Type-check client**

Run: `cd client && npx tsc --noEmit`
Expected: no errors; `RecordItem` import resolves.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Statistics.tsx
git commit -m "feat(stats): render Records tab with clay cards"
```

---

## Task 6: Cache invalidation — Tasks writes

**Files:**
- Modify: `server/src/modules/tasks/tasks.service.ts`

**Interfaces:** Reuses existing `StatisticsService.invalidate(userId, scope)` exactly as activity/money/habits/goals already do.

- [ ] **Step 1: Inject `StatisticsService`**

At top: `import { StatisticsService } from '../statistics/statistics.service';`
In constructor (mirror habits.service pattern): `private statisticsService: StatisticsService,`

> ponytail: if `TasksModule` doesn't already import `StatisticsModule`, add `StatisticsModule` to `TasksModule` imports (it's `@Global()`, so likely already available — verify, don't add redundantly).

- [ ] **Step 2: Invalidate on create/complete/delete**

After each task write that changes `totalTasks`/`totalCompletedTasks`, call:

```ts
await this.statisticsService.invalidate(userId, 'overall');
```

Place it in: create-task, toggle-complete (or update-status to completed), delete-task. Mirror the 2-line pattern from `habits.service.ts:84-85`.

- [ ] **Step 3: Type-check**

Run: `cd server && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/tasks/tasks.service.ts
git commit -m "fix(stats): invalidate overall cache on task writes"
```

---

## Task 7: Cache invalidation — Milestone writes

**Files:**
- Modify: `server/src/modules/goals/goals.service.ts`

**Interfaces:** Reuses `this.statisticsService.invalidate(userId, 'goal')` + `'overall'` (already imported/injected in this file).

- [ ] **Step 1: Add invalidation to milestone mutations**

In `createMilestone`, `updateMilestone`, `deleteMilestone`, `scheduleMilestone` — after the DB write — add (mirror lines 88-89):

```ts
await this.statisticsService.invalidate(userId, 'goal');
await this.statisticsService.invalidate(userId, 'overall');
```

For `scheduleMilestone` the `userId` comes from the goal lookup — reuse the same `userId` variable already resolved in that method.

- [ ] **Step 2: Type-check**

Run: `cd server && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/goals/goals.service.ts
git commit -m "fix(stats): invalidate goal/overall cache on milestone writes"
```

---

## Task 8: Claymorphism audit (Impeccable MCP)

**Files:**
- Audit (no logic change unless a token violation is found): `client/src/pages/Statistics.tsx`

**Interfaces:** Uses `impeccable:impeccable` skill against `design.md` token table.

- [ ] **Step 1: Run Impeccable audit**

Invoke `impeccable:impeccable` on `Statistics.tsx` with the `design.md` token table as the style reference. Check: every color is a `--clay-*` / `--blue-*` / `--semantic-*` token (no raw hex), every card uses `clay-level-1/2`, radii use `--radius-*`.

- [ ] **Step 2: Apply fixes only if a real violation exists**

If Impeccable flags a raw hex or missing clay shadow, apply the token swap via `impeccable-manual-edit-applier`. If clean, no change.

- [ ] **Step 3: Commit (only if changed)**

```bash
git add client/src/pages/Statistics.tsx
git commit -m "style(stats): align Statistics UI to claymorphism tokens"
```

> ponytail: Impeccable is a manual-edit applier, not a design generator — used here strictly as the token-consistency gate the user requested, not to invent new visuals.

---

## Task 9: Verify end-to-end (verify skill + chrome-devtools)

**Files:** runtime only.

- [ ] **Step 1: Boot full stack**

Run server + client dev servers. Confirm both compile (Tasks 1–8 type-checks already green).

- [ ] **Step 2: Curl all 7 endpoints**

```bash
for p in overall time activity money habit goal records; do
  echo "== $p =="; curl -s "http://localhost:3000/api/statistics/$p" | head -c 200; echo
done
```

Expected: `records` returns `{"records":[ ... ]}` with 9 items; others unchanged.

- [ ] **Step 3: Write-path invalidation check**

Create a task via the existing Tasks API, then `curl /api/statistics/overall?forceRefresh=true` — confirm `totalTasks` increased. Create a milestone via Goals API, confirm `totalMilestones` reflects after refresh.

- [ ] **Step 4: Screenshot Records tab**

Use `chrome-devtools-mcp` to open the Statistics page, click the **Records** tab, screenshot. Confirm: big numbers, clay shadows (`clay-level-1`), blue badge per card, no raw-hex colors.

- [ ] **Step 5: Report**

Summarize pass/fail per endpoint + screenshot path. Do not commit runtime artifacts.

---

## Self-Review

**1. Spec coverage** — `11-statistics.md` requires 7 views + 7 endpoints. Existing: 6 views/endpoints. This plan adds the 7th (`records`) across types/service/controller/hook/UI (Tasks 1–5) → covered. Lazy invalidation pattern extended to Tasks + Milestones (Tasks 6–7) → covers spec §"Catatan Implementasi" (`milestones` explicitly named; `tasks` implied by OverviewStats reading tasks). Cache table + TTL already present → no new work. No MATERIALIZED VIEW → respected. Claymorphism scannable layout → Task 5 + Task 8.

**2. Placeholder scan** — No TBD/TODO. Every code step shows the code. Verification steps give exact commands + expected output.

**3. Type consistency** — `RecordItem`/`RecordsStats`/`RecordScope` defined in Task 1, imported in Task 2 (service) and Task 4/5 (client). `getRecords()` signature `getRecords(userId, forceRefresh?)` matches controller call (`DEFAULT_USER_ID, forceRefresh === 'true'`) and client `useRecordsStats(forceRefresh?)`. `invalidate(userId, scope)` reused with identical signature across Tasks 6–7 as in existing services. No name drift.

**Gaps intentionally skipped (YAGNI):** No dedicated Records SQL query (reuses `getAll` — spec says Records is a roll-up of the same extremes). No new test framework (ponytail: runtime verification in Task 9 suffices; user didn't request a suite). No Records cache scope (reads already-cached 6 scopes).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-14-statistics-records.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch agents A→E per the orchestration table, review between tasks. Matches the multi-agent requirement.

**2. Inline Execution** — Execute tasks in this session via `executing-plans`, batch with checkpoints.

Which approach?
