# Analytics Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Analytics frontend (page, API hooks, shared types) to consume the 5 existing backend endpoints, with Recharts visualizations and CSV export.

**Architecture:** React page with tabbed layout (5 tabs mirror API), React Query hooks for data fetching, Recharts for time-distribution/trend charts, existing Statistics page as reference pattern. The backend (controller, service, snapshot generator, scheduler, score-calculator, schema) is already fully built — this plan is frontend-only.

**Tech Stack:** React 19, @tanstack/react-query, Recharts, Tailwind CSS v4, class-validator (backend, already done), node-cron (backend, already installed), date-fns (already installed in client).

## Global Constraints

- Single-user: always `DEFAULT_USER_ID = 'default'` on backend
- Analytics is read-only consumer of other modules — never writes to them
- Snapshot-based: analytics_snapshots table is pre-computed cache, not source of truth
- Score formulas: use placeholder implementations in `score-calculator.ts` (approved by user)
- Dashboard already has hardcoded planned-vs-actual data — NOT part of this plan; leave as-is
- Stats/analytics split: Statistics = raw numbers, Analytics = patterns + scores
- Follow client/src/pages/Statistics.tsx patterns for layout, loading/error/empty states, tab structure, claymorphism tokens

## What Already Exists (skip these)

- **Backend (complete):** `analytics.controller.ts` (5 endpoints), `analytics.service.ts` (full query logic), `snapshot.service.ts` (daily/weekly/monthly/yearly), `score-calculator.ts` (placeholder formulas), `scheduler.service.ts` (node-cron daily 01:00), `analytics.module.ts`, Drizzle schema `analyticsSnapshots`
- **Route:** `/analytics` already registered in `App.tsx` → currently `PlaceholderPage`
- **Dependencies:** node-cron installed, Recharts needs install

---

### Task 1: Add Analytics shared types

**Files:**
- Create: `shared/src/types/analytics.ts`
- Modify: `shared/src/index.ts`

**Interfaces:**
- Produces: `ReviewResponse`, `PlannedVsActualItem`, `TimeDistributionEntry`, `TrendItem`, `AnalyticsExportResponse` — consumed by API hooks (Task 2) and page (Task 3)

- [ ] **Step 1: Create `shared/src/types/analytics.ts`**

```ts
export interface ReviewResponse {
  scores: {
    discipline: number | null;
    focus: number | null;
    consistency: number | null;
  };
  timeDistribution: Record<string, number>;
  overallStats: Record<string, unknown> | null;
  generatedAt: string;
}

export interface PlannedVsActualItem {
  date: string;
  planned: number;
  actual: number;
  category?: string;
}

export interface TimeDistributionEntry {
  date: string;
  productive: number;
  leisure: number;
  sleep: number;
  other: number;
}

export interface TrendItem {
  periodStart: string;
  value: number;
}

export interface AnalyticsExportResponse {
  format: string;
  data: string;
  generatedAt: string;
}
```

- [ ] **Step 2: Export from `shared/src/index.ts`**

Add inside the exports block:
```ts
export type {
  ReviewResponse,
  PlannedVsActualItem,
  TimeDistributionEntry,
  TrendItem,
  AnalyticsExportResponse,
} from './types/analytics';
```

- [ ] **Step 3: Rebuild shared**

```bash
npm run build -w shared
```

Expected: `tsc` exits 0.

- [ ] **Step 4: Commit**

```bash
git add shared/
git commit -m "feat(analytics): add shared types for analytics API responses"
```

---

### Task 2: Add Analytics React Query hooks

**Files:**
- Create: `client/src/api/analytics.ts`
- Verify: no other files need modification

**Interfaces:**
- Consumes: shared types from Task 1
- Produces: `useReview`, `usePlannedVsActual`, `useTimeDistribution`, `useTrend`, `useExportAnalytics` hooks — consumed by page (Task 3)

- [ ] **Step 1: Create `client/src/api/analytics.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import type {
  ReviewResponse,
  PlannedVsActualItem,
  TimeDistributionEntry,
  TrendItem,
} from '@whatdo/shared';

const BASE = '/api/analytics';

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Analytics API error: ${res.status}`);
  return res.json();
}

export function useReview(period: 'daily' | 'weekly' | 'monthly' | 'yearly', date: string) {
  return useQuery<ReviewResponse>({
    queryKey: ['analytics', 'review', period, date],
    queryFn: () => request(`${BASE}/review?period=${period}&date=${date}`),
    enabled: !!period && !!date,
  });
}

export function usePlannedVsActual(start: string, end: string) {
  return useQuery<PlannedVsActualItem[]>({
    queryKey: ['analytics', 'planned-vs-actual', start, end],
    queryFn: () => request(`${BASE}/planned-vs-actual?start=${start}&end=${end}`),
    enabled: !!start && !!end,
  });
}

export function useTimeDistribution(start: string, end: string) {
  return useQuery<TimeDistributionEntry[]>({
    queryKey: ['analytics', 'time-distribution', start, end],
    queryFn: () => request(`${BASE}/time-distribution?start=${start}&end=${end}`),
    enabled: !!start && !!end,
  });
}

export function useTrend(metric: string, start: string, end: string) {
  return useQuery<TrendItem[]>({
    queryKey: ['analytics', 'trend', metric, start, end],
    queryFn: () => request(`${BASE}/trend?metric=${metric}&start=${start}&end=${end}`),
    enabled: !!metric && !!start && !!end,
  });
}

export function useExportAnalytics() {
  return useQuery<{ format: string; data: string }>({
    queryKey: ['analytics', 'export'],
    queryFn: () => request(`${BASE}/export?format=csv`),
    enabled: false, // never auto-fetch — triggered manually
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit -p client/tsconfig.json
```

Expected: only pre-existing errors (ProgressBar max prop, unrelated).

- [ ] **Step 3: Commit**

```bash
git add client/src/api/analytics.ts
git commit -m "feat(analytics): add React Query hooks for all analytics endpoints"
```

---

### Task 3: Install Recharts and create Analytics page

**Files:**
- Install: `recharts` npm package
- Create: `client/src/pages/Analytics.tsx`
- Modify: `client/src/App.tsx` (replace PlaceholderPage with AnalyticsPage)

**Interfaces:**
- Consumes: hooks from Task 2, shared types from Task 1, Recharts components
- Produces: fully functional `/analytics` page with 5 tabs

- [ ] **Step 1: Install Recharts**

```bash
cd /home/sejel/Downloads/what\ do\ i\ do && npm install recharts -w client
```

- [ ] **Step 2: Create `client/src/pages/Analytics.tsx`**

The page follows the Statistics.tsx pattern — tabbed interface, Card grid, claymorphism tokens.

Structure:
```
imports (React, Recharts, lucide icons, UI components, analytics hooks)
TABS constant (review, planned-vs-actual, time-distribution, trend, export)

ReviewTab — Score cards (discipline, focus, consistency) + mini time-distribution pie
PlannedVsActualTab — BarChart comparing planned vs actual hours per category
TimeDistributionTab — Stacked area chart per day (productive, leisure, sleep)
TrendTab — Metric selector + LineChart over date range
ExportTab — CSV download button
AnalyticsPage — Main component with tab bar + conditional rendering
```

**Review Tab:**
```tsx
function ReviewTab({ period, date }: { period: string; date: string }) {
  const { data, isLoading, error } = useReview(period as any, date);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScoreCard label="Discipline" value={data.scores.discipline} icon={Target} />
        <ScoreCard label="Focus" value={data.scores.focus} icon={Brain} />
        <ScoreCard label="Consistency" value={data.scores.consistency} icon={Activity} />
      </div>
      {/* Time distribution pie */}
      <Card level={1}>
        <CardTitle>Time Distribution</CardTitle>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
```

**PlannedVsActual Tab:**
```tsx
function PlannedVsActualTab() {
  const [startDate, setStartDate] = useState(/* last 7 days */);
  const [endDate, setEndDate] = useState(todayStr());
  const { data, isLoading } = usePlannedVsActual(startDate, endDate);

  // BarChart: X=category, Y=hours, grouped bars (planned vs actual)
  return (
    <div className="space-y-4">
      {/* Date range pickers */}
      <div className="flex gap-4">
        <input type="date" value={startDate} onChange={...} className="..." />
        <input type="date" value={endDate} onChange={...} className="..." />
      </div>
      {isLoading ? <LoadingState /> : (
        <Card level={1}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
              <Bar dataKey="actual" fill="#22c55e" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
```

**TimeDistribution Tab:**
```tsx
function TimeDistributionTab() {
  // Stacked bar/area chart: per day, productive/leisure/sleep/other
  // Date range picker + chart
}
```

**Trend Tab:**
```tsx
function TrendTab() {
  // Metric selector dropdown + LineChart over selected range
  const METRICS = [
    { key: 'discipline_score', label: 'Discipline' },
    { key: 'focus_score', label: 'Focus' },
    { key: 'consistency_score', label: 'Consistency' },
  ];
  // LineChart with dots, gradient area fill
}
```

**Export Tab:**
```tsx
function ExportTab() {
  // CSV download button with loading/error states
  const handleExport = async () => {
    const res = await fetch('/api/analytics/export?format=csv');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
}
```

**Full page component:**
```tsx
export function AnalyticsPage() {
  const [tab, setTab] = useState('review');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Analytics</h1>
          <p className="font-body text-[15px] text-ink-500 mt-1">
            Patterns, trends, and scores across your activity.
          </p>
        </div>
      </div>

      {/* Period selector + Tab bar */}
      <div className="flex items-center gap-4">
        <select value={period} onChange={e => setPeriod(e.target.value as any)}
          className="rounded-[--radius-md] bg-clay-surface px-3 py-2 font-body text-[13px] clay-l1">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        {/* Tab buttons */}
        <div className="flex gap-1">{[...TABS].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-[--radius-sm] font-body text-[13px] clay-transition ${
              tab === t.key ? 'bg-blue-500 text-white clay-l1' : 'text-ink-400 hover:text-ink-700'
            }`}>
            {t.label}
          </button>
        ))}</div>
      </div>

      {/* Tab content */}
      {tab === 'review' && <ReviewTab period={period} date={date} />}
      {tab === 'planned-vs-actual' && <PlannedVsActualTab />}
      {tab === 'time-distribution' && <TimeDistributionTab />}
      {tab === 'trend' && <TrendTab />}
      {tab === 'export' && <ExportTab />}
    </div>
  );
}
```

- [ ] **Step 3: Wire up route in `client/src/App.tsx`**

Change:
```tsx
import { AnalyticsPage } from './pages/Analytics';
// ...
<Route path="/analytics" element={<AnalyticsPage />} />
```

Replace existing import of `PlaceholderPage` if no longer needed for other routes (it is still used by Achievements, Insights, Workspace, Settings — keep it).

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit -p client/tsconfig.json
```

Expected: only pre-existing ProgressBar errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Analytics.tsx client/src/App.tsx package-lock.json
git commit -m "feat(analytics): add analytics page with Recharts visualizations"
```

---

### Task 4: Add Loading/Error/Empty states and period date logic

(Implemented inline in Task 3, but extracted here for clarity)

**Shared UI patterns (follow Statistics.tsx):**

Loading state:
```tsx
function LoadingState() {
  return (
    <div className="flex justify-center py-16 text-ink-300">
      <Loader2 className="size-8 animate-spin" />
    </div>
  );
}
```

Error state:
```tsx
function ErrorState() {
  return (
    <Card level={1}>
      <p className="font-body text-[15px] text-semantic-red">Failed to load analytics data.</p>
    </Card>
  );
}
```

Empty state — shown when data array is empty after loading:
```tsx
<EmptyState
  icon={<BarChart3 className="size-8" />}
  title="No data yet"
  description="Analytics data will appear once you have activity logs and completed tasks."
/>
```

Period helpers:
```tsx
function periodStart(period: string, date: string): string {
  const d = new Date(date);
  switch (period) {
    case 'daily': return date;
    case 'weekly': return startOfWeek(d).toISOString().split('T')[0];
    case 'monthly': return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
    case 'yearly': return `${d.getFullYear()}-01-01`;
    default: return date;
  }
}
```

---

### Task 5: Verify end-to-end

- [ ] **Step 1: Start the app**

```bash
cd /home/sejel/Downloads/what\ do\ i\ do && npm run dev
```

- [ ] **Step 2: Navigate to `/analytics`**

Verify the page renders with tab bar and period selector.

- [ ] **Step 3: Test Review tab**

Select each period type (daily/weekly/monthly/yearly). Verify scores display (may be null if no data yet), time-distribution pie renders.

- [ ] **Step 4: Test Planned-vs-Actual tab**

Verify date range pickers work, BarChart renders with planned/actual bars.

- [ ] **Step 5: Test Time Distribution tab**

Verify stacked chart renders per day.

- [ ] **Step 6: Test Trend tab**

Verify metric selector works, LineChart renders with trend data.

- [ ] **Step 7: Test Export tab**

Click "Export CSV" — verify file downloads.

- [ ] **Step 8: Typecheck both**

```bash
cd /home/sejel/Downloads/what\ do\ i\ do && npx tsc --noEmit -p client/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
```

- [ ] **Step 9: Commit any remaining changes**

---

## Multi-Agent Orchestration

```
         Task 1 (shared types)
             |
        Task 2 (API hooks)
             |
   ┌─────────┴─────────┐
   │                   │
Task 3a              Task 3b
(Install Recharts)   (Write page)
   │                   │
   └─────────┬─────────┘
             │
     Task 4 (verify + wire)
```

**Optimal execution:** Tasks 1-2 are sequential (types → hooks). Then install Recharts and write the page in parallel (or the same agent). Verify at the end.

**Single-agent approach** (simpler, fewer context switches): One agent does Tasks 1-3, one agent does Tasks 4-5. Or execute inline in this session.

---

## Verification Summary

| Check | How |
|---|---|
| Shared types compile | `npm run build -w shared` |
| Client typecheck | `npx tsc --noEmit -p client/tsconfig.json` |
| Page renders | Navigate to `/analytics` |
| All 5 tabs work | Click each tab, verify content |
| Charts render | Visual check of Recharts components |
| Export downloads | Click export button, verify file |
| Backend endpoints | Already verified in previous build phase |
