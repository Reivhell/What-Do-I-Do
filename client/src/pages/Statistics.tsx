import { useState } from 'react';
import {
  BarChart3, Clock, Activity, Wallet, Flame, Target, Award, RefreshCw, Loader2,
} from 'lucide-react';
import { Card, CardTitle, Badge, ProgressBar, EmptyState } from '../components/ui';
import { useAllStats } from '../api/statistics';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const fmtTime = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'time', label: 'Time', icon: Clock },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'money', label: 'Money', icon: Wallet },
  { key: 'habit', label: 'Habit', icon: Flame },
  { key: 'goal', label: 'Goal', icon: Target },
  { key: 'records', label: 'Records', icon: Award },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ── Stat Card ── */
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: 'green' | 'red' | 'blue' }) {
  const colorMap = { green: 'text-semantic-green', red: 'text-semantic-red', blue: 'text-blue-600' };
  return (
    <div className="rounded-[--radius-lg] bg-clay-surface p-5 clay-l1">
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">{label}</p>
      <p className={`font-display text-2xl font-bold mt-1 ${color ? colorMap[color] : 'text-ink-900'}`}>{value}</p>
      {sub && <p className="font-body text-[13px] text-ink-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Page ── */
export function StatisticsPage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [forceRefresh, setForceRefresh] = useState(false);
  const { data, isLoading, error, refetch } = useAllStats(forceRefresh);

  const handleRefresh = () => {
    setForceRefresh(true);
    refetch().then(() => setForceRefresh(false));
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Statistics</h1>
          <p className="font-body text-[15px] text-ink-500 mt-1">
            Raw numbers, totals, and records across all modules.
          </p>
        </div>
        <button onClick={handleRefresh} disabled={isLoading}
          className="flex items-center gap-2 rounded-[--radius-md] bg-clay-surface px-4 py-2 clay-l1 text-ink-500 hover:text-ink-900 disabled:opacity-50"
        ><RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-[--radius-pill] px-4 py-2 font-body text-[13px] font-semibold clay-transition ${
              tab === t.key ? 'bg-blue-500 text-white clay-l1' : 'bg-clay-surface text-ink-500 hover:text-ink-900 clay-l1'
            }`}
          ><t.icon className="size-4" />{t.label}</button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-ink-300" /></div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <Card level={1} className="!p-4"><p className="font-body text-[15px] text-semantic-red">Failed to load statistics.</p></Card>
      )}

      {/* Data */}
      {data && !isLoading && (
        <>
          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Activity Sessions" value={String(data.overall.totalActivitySessions)} color="blue" />
              <StatCard label="Hours Tracked" value={fmtTime(data.overall.totalHoursTracked)} color="blue" />
              <StatCard label="Tasks Completed" value={`${data.overall.totalCompletedTasks} / ${data.overall.totalTasks}`} color="green" />
              <StatCard label="Total Income" value={fmt(data.overall.totalIncome)} color="green" />
              <StatCard label="Total Expense" value={fmt(data.overall.totalExpense)} color="red" />
              <StatCard label="Transactions" value={String(data.overall.totalTransactions)} color="blue" />
              <StatCard label="Habit Completions" value={String(data.overall.totalHabitCompletions)} color="green" />
              <StatCard label="Habits" value={String(data.overall.totalHabits)} color="blue" />
              <StatCard label="Goals Completed" value={`${data.overall.totalCompletedGoals} / ${data.overall.totalGoals}`} color="green" />
              <StatCard label="Milestones" value={`${data.overall.totalCompletedMilestones} / ${data.overall.totalMilestones}`} color="blue" />
            </div>
          )}

          {/* ── Time Tab ── */}
          {tab === 'time' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-[--radius-lg] bg-blue-500 p-6 text-white clay-l2 text-center">
                <p className="font-body text-[15px] text-blue-100">Total Hours Tracked</p>
                <p className="font-display text-5xl font-bold mt-2">{fmtTime(data.time.totalHoursTracked)}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Avg Session" value={Math.round(data.time.averageSessionMinutes) > 0 ? `${Math.round(data.time.averageSessionMinutes)}m` : 'N/A'} />
                <StatCard label="Longest Session" value={data.time.longestSessionMinutes > 0 ? `${data.time.longestSessionMinutes}m` : 'N/A'} />
                <StatCard label="Sessions/Day" value={data.time.sessionsPerDayAverage > 0 ? String(data.time.sessionsPerDayAverage) : 'N/A'} />
              </div>
              {data.time.mostActiveDayOfWeek && (
                <Card level={1} className="!p-4 text-center">
                  <p className="font-body text-[13px] text-ink-500">Most Active Day</p>
                  <p className="font-display text-xl font-bold text-ink-900 mt-1">{data.time.mostActiveDayOfWeek}</p>
                </Card>
              )}
            </div>
          )}

          {/* ── Activity Tab ── */}
          {tab === 'activity' && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {data.activity.mostFrequentActivity && (
                  <StatCard label="Most Frequent" value={data.activity.mostFrequentActivity} />
                )}
                <StatCard label="Longest Session" value={data.activity.longestSessionMinutes > 0 ? `${data.activity.longestSessionMinutes}m` : 'N/A'} />
              </div>
              {data.activity.sessionsByActivity.length === 0 && (
                <EmptyState icon={<Activity className="size-8" />} title="No activity data" description="Start tracking your activities to see stats here." />
              )}
              {data.activity.sessionsByActivity.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.04em]">Per Activity</p>
                  {data.activity.sessionsByActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-[--radius-md] bg-clay-surface px-4 py-3 clay-l1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-body font-semibold text-[15px] text-ink-900">{a.activityName}</span>
                          <Badge variant="info">{a.category}</Badge>
                        </div>
                      </div>
                      <span className="font-body text-[13px] text-ink-500">{a.totalSessions} sessions</span>
                      <span className="font-display text-lg font-bold text-ink-900">{fmtTime(a.totalMinutes / 60)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Money Tab ── */}
          {tab === 'money' && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card level={1} className="!p-5 text-center">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-semantic-green">Income</p>
                  <p className="font-display text-2xl font-bold text-semantic-green mt-1">{fmt(data.money.totalIncome)}</p>
                </Card>
                <Card level={1} className="!p-5 text-center">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-semantic-red">Expense</p>
                  <p className="font-display text-2xl font-bold text-semantic-red mt-1">{fmt(data.money.totalExpense)}</p>
                </Card>
                <Card level={1} className="!p-5 text-center">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">Net</p>
                  <p className={`font-display text-2xl font-bold mt-1 ${data.money.netSavings >= 0 ? 'text-semantic-green' : 'text-semantic-red'}`}>{fmt(data.money.netSavings)}</p>
                </Card>
              </div>

              <Card level={1} className="!p-4">
                <p className="font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.04em] mb-2">Records</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.money.biggestExpense && (
                    <div className="rounded-[--radius-md] bg-clay-surface-alt p-3 clay-inset">
                      <p className="font-body text-[12px] text-semantic-red font-semibold">Biggest Expense</p>
                      <p className="font-display text-lg font-bold text-ink-900">{fmt(data.money.biggestExpense.amount)}</p>
                      <p className="font-body text-[12px] text-ink-400">{data.money.biggestExpense.category} · {data.money.biggestExpense.date}</p>
                    </div>
                  )}
                  {data.money.biggestIncome && (
                    <div className="rounded-[--radius-md] bg-clay-surface-alt p-3 clay-inset">
                      <p className="font-body text-[12px] text-semantic-green font-semibold">Biggest Income</p>
                      <p className="font-display text-lg font-bold text-ink-900">{fmt(data.money.biggestIncome.amount)}</p>
                      <p className="font-body text-[12px] text-ink-400">{data.money.biggestIncome.date}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card level={1} className="!p-4">
                <p className="font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.04em] mb-3">Expense by Category</p>
                {data.money.expenseByCategory.length === 0 && <p className="font-body text-[13px] text-ink-400 italic">No expense data</p>}
                {data.money.expenseByCategory.map((e) => (
                  <div key={e.category} className="flex items-center justify-between py-2 border-b border-clay-border last:border-0">
                    <span className="font-body text-[14px] text-ink-900">{e.category}</span>
                    <span className="font-body text-[14px] font-semibold text-semantic-red">{fmt(e.amount)}</span>
                  </div>
                ))}
              </Card>

              <Card level={1} className="!p-4">
                <p className="font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.04em] mb-3">Income by Category</p>
                {data.money.incomeByCategory.length === 0 && <p className="font-body text-[13px] text-ink-400 italic">No income data</p>}
                {data.money.incomeByCategory.map((e) => (
                  <div key={e.category} className="flex items-center justify-between py-2 border-b border-clay-border last:border-0">
                    <span className="font-body text-[14px] text-ink-900">{e.category}</span>
                    <span className="font-body text-[14px] font-semibold text-semantic-green">{fmt(e.amount)}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ── Habit Tab ── */}
          {tab === 'habit' && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Habits" value={String(data.habit.totalHabits)} />
                <StatCard label="Best Streak" value={String(data.habit.bestStreak)} sub={data.habit.bestStreakHabitName ?? undefined} color="green" />
                <StatCard label="Total Completions" value={String(data.habit.totalCompletions)} color="green" />
                <StatCard label="Total Missed" value={String(data.habit.totalMissed)} color="red" />
              </div>
              {data.habit.mostConsistentHabit && (
                <Card level={1} className="!p-4">
                  <p className="font-body text-[13px] text-ink-500">Most Consistent Habit</p>
                  <p className="font-display text-xl font-bold text-ink-900">{data.habit.mostConsistentHabit.name}</p>
                  <ProgressBar value={data.habit.mostConsistentHabit.completionRate} max={100} />
                  <p className="font-body text-[13px] text-ink-500 mt-1">{data.habit.mostConsistentHabit.completionRate}% completion rate</p>
                </Card>
              )}
              {data.habit.habits.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.04em]">All Habits</p>
                  {data.habit.habits.map((h, i) => (
                    <div key={i} className="rounded-[--radius-md] bg-clay-surface p-4 clay-l1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body font-semibold text-[15px] text-ink-900">{h.name}</span>
                        <span className="font-body text-[13px] text-ink-500">{h.completionRate}%</span>
                      </div>
                      <ProgressBar value={h.completionRate} max={100} />
                      <div className="flex gap-4 mt-2">
                        <span className="font-body text-[12px] text-ink-400">Best streak: {h.bestStreak}</span>
                        <span className="font-body text-[12px] text-ink-400">Current: {h.currentStreak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Goal Tab ── */}
          {tab === 'goal' && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Goals" value={String(data.goal.totalGoals)} />
                <StatCard label="Active" value={String(data.goal.activeGoals)} color="blue" />
                <StatCard label="Completed" value={String(data.goal.completedGoals)} color="green" />
                <StatCard label="At Risk" value={String(data.goal.atRiskGoals)} color="red" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="Avg Progress" value={`${data.goal.averageProgressPercent}%`} />
                <StatCard label="Milestones" value={`${data.goal.completedMilestones} / ${data.goal.totalMilestones}`} />
              </div>
              {data.goal.goals.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.04em]">All Goals</p>
                  {data.goal.goals.map((g, i) => (
                    <div key={i} className="rounded-[--radius-md] bg-clay-surface p-4 clay-l1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-body font-semibold text-[15px] text-ink-900">{g.title}</span>
                          <Badge variant={g.status === 'completed' ? 'success' : g.status === 'at_risk' ? 'danger' : 'default'}>{g.status}</Badge>
                        </div>
                        <span className="font-body text-[13px] font-semibold text-ink-700">{g.progressPercent}%</span>
                      </div>
                      <ProgressBar value={g.progressPercent} max={100} />
                      <p className="font-body text-[12px] text-ink-400 mt-1">Milestones: {g.completedMilestoneCount} / {g.milestoneCount}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Records Tab ── */}
          {tab === 'records' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Longest Session */}
              {(data.time.longestSessionMinutes > 0 || data.activity.longestSessionMinutes > 0) && (
                <Card level={1} className="!p-4">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">Longest Session</p>
                  <p className="font-display text-2xl font-bold text-blue-600 mt-1">
                    {Math.max(data.time.longestSessionMinutes, data.activity.longestSessionMinutes)}m
                  </p>
                  {data.activity.mostFrequentActivity && (
                    <p className="font-body text-[13px] text-ink-400">Most frequent: {data.activity.mostFrequentActivity}</p>
                  )}
                </Card>
              )}

              {/* Biggest Expense */}
              {data.money.biggestExpense && (
                <Card level={1} className="!p-4">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-semantic-red">Biggest Expense</p>
                  <p className="font-display text-2xl font-bold text-semantic-red mt-1">{fmt(data.money.biggestExpense.amount)}</p>
                  <p className="font-body text-[13px] text-ink-400">{data.money.biggestExpense.category} · {data.money.biggestExpense.date}</p>
                </Card>
              )}

              {/* Biggest Income */}
              {data.money.biggestIncome && (
                <Card level={1} className="!p-4">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-semantic-green">Biggest Income</p>
                  <p className="font-display text-2xl font-bold text-semantic-green mt-1">{fmt(data.money.biggestIncome.amount)}</p>
                  <p className="font-body text-[13px] text-ink-400">{data.money.biggestIncome.date}</p>
                </Card>
              )}

              {/* Best Habit Streak */}
              {data.habit.bestStreak > 0 && (
                <Card level={1} className="!p-4">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">Best Habit Streak</p>
                  <p className="font-display text-2xl font-bold text-green-600 mt-1">{data.habit.bestStreak} days</p>
                  {data.habit.bestStreakHabitName && <p className="font-body text-[13px] text-ink-400">{data.habit.bestStreakHabitName}</p>}
                </Card>
              )}

              {/* Highest Goal Progress */}
              <Card level={1} className="!p-4">
                <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">Highest Goal Progress</p>
                {data.goal.goals.length > 0 ? (
                  <>
                    {(() => {
                      const sorted = [...data.goal.goals].sort((a, b) => b.progressPercent - a.progressPercent);
                      const top = sorted[0];
                      return <>
                        <p className="font-display text-2xl font-bold text-ink-900 mt-1">{top.title}</p>
                        <ProgressBar value={top.progressPercent} max={100} />
                        <p className="font-body text-[13px] text-ink-500 mt-1">{top.progressPercent}% complete</p>
                      </>;
                    })()}
                  </>
                ) : (
                  <p className="font-body text-[13px] text-ink-400 italic mt-2">No goals yet</p>
                )}
              </Card>

              {/* Most Consistent Habit */}
              {data.habit.mostConsistentHabit && (
                <Card level={1} className="!p-4">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">Most Consistent Habit</p>
                  <p className="font-display text-2xl font-bold text-green-600 mt-1">{data.habit.mostConsistentHabit.name}</p>
                  <p className="font-body text-[13px] text-ink-400">{data.habit.mostConsistentHabit.completionRate}% completion</p>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* No data at all */}
      {!isLoading && !error && !data && (
        <EmptyState icon={<BarChart3 className="size-8" />} title="No statistics yet" description="Use the app to generate data — stats will appear here automatically." />
      )}
    </div>
  );
}
