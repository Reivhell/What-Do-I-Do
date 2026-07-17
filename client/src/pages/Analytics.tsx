import { useState } from 'react';
import { BarChart3, Brain, Target, TrendingUp, Activity, Clock, Loader2 } from 'lucide-react';
import { Card, CardTitle, ProgressBar, EmptyState } from '../components/ui';
import { useAnalyticsSummary, usePlannedVsActual, useTimeDistribution, useTrend } from '../api/analytics';

function getToday() {
  return new Date().toISOString().split('T')[0];
}
function getWeekAgo() { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; }
function getMonthAgo() { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; }

function ScoreCard({ label, value, icon: Icon }: { label: string; value: number | null; icon: any }) {
  return (
    <Card level={1} className="text-center p-5">
      <div className="bg-[var(--blue-50)] rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
        <Icon className="size-6 text-[var(--blue-500)]" />
      </div>
      <p className="font-body text-[13px] font-medium text-[var(--ink-500)]">{label}</p>
      <p className="font-display text-3xl font-bold mt-1 text-[var(--ink-900)]">
        {value !== null ? `${Math.round(value)}%` : 'N/A'}
      </p>
    </Card>
  );
}

function ScoreSection({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ScoreCard label="Discipline" value={data.scores.discipline} icon={Brain} />
      <ScoreCard label="Focus" value={data.scores.focus} icon={Target} />
      <ScoreCard label="Consistency" value={data.scores.consistency} icon={TrendingUp} />
    </div>
  );
}

function TimeDistributionSection() {
  const today = getToday();
  const weekAgo = getWeekAgo();
  const { data, isLoading } = useTimeDistribution(weekAgo, today);

  if (isLoading) return <Card level={1}><p className="font-body text-[13px] text-[var(--ink-400)]">Loading...</p></Card>;
  if (!data || data.categories.length === 0) {
    return <EmptyState icon={<Clock className="size-8" />} title="No time data" description="Track your activities to see time distribution here." />;
  }

  const total = data.totalMinutes || data.categories.reduce((s: number, c: any) => s + c.minutes, 0);

  return (
    <Card level={1}>
      <div className="flex flex-col gap-3">
        <p className="font-body text-[13px] font-semibold text-[var(--ink-500)]">Past 7 Days</p>
        {data.categories.map((c: any) => {
          const pct = total > 0 ? Math.round((c.minutes / total) * 100) : 0;
          return (
            <div key={c.category} className="flex items-center gap-3">
              <span className="font-body text-[14px] text-[var(--ink-900)] w-24 truncate">{c.category}</span>
              <div className="flex-1">
                <div className="h-2 w-full rounded-[--radius-pill] bg-blue-100">
                  <div className="h-full rounded-[--radius-pill] bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="font-body text-[13px] text-[var(--ink-500)] w-16 text-right">{c.minutes}m</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PlannedVsActualSection() {
  const today = getToday();
  const weekAgo = getWeekAgo();
  const { data, isLoading } = usePlannedVsActual(weekAgo, today);

  if (isLoading) return <Card level={1}><p className="font-body text-[13px] text-[var(--ink-400)]">Loading...</p></Card>;
  if (!data) return null;

  return (
    <Card level={1}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-[13px] font-semibold text-[var(--ink-500)]">Planned vs Actual</p>
        <span className="font-display text-lg font-bold text-[var(--ink-900)]">{data.completionRate}%</span>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 rounded-[--radius-md] bg-clay-surface p-3 clay-inset text-center">
          <p className="font-body text-[12px] text-[var(--ink-500)]">Planned</p>
          <p className="font-display text-xl font-bold text-[var(--ink-900)]">{data.planned}</p>
        </div>
        <div className="flex-1 rounded-[--radius-md] bg-clay-surface p-3 clay-inset text-center">
          <p className="font-body text-[12px] text-[var(--ink-500)]">Actual</p>
          <p className="font-display text-xl font-bold text-[var(--ink-900)]">{data.actual}</p>
        </div>
      </div>
    </Card>
  );
}

function TrendSection() {
  const today = getToday();
  const monthAgo = getMonthAgo();
  const { data, isLoading } = useTrend('discipline_score', monthAgo, today);

  if (isLoading) return <Card level={1}><p className="font-body text-[13px] text-[var(--ink-400)]">Loading...</p></Card>;
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((p: any) => p.value ?? 0), 1);

  return (
    <Card level={1}>
      <p className="font-body text-[13px] font-semibold text-[var(--ink-500)] mb-3">Discipline Trend (30 days)</p>
      <div className="flex items-end gap-1 h-24">
        {data.slice(-14).map((p: any) => {
          const h = maxVal > 0 ? (p.value ?? 0) / maxVal : 0;
          return (
            <div key={p.periodStart} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-[--radius-sm] bg-blue-500 transition-all" style={{ height: `${h * 100}%` }} />
              <span className="font-body text-[9px] text-[var(--ink-400)]">{p.periodStart.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Page ── */
export function AnalyticsPage() {
  const today = getToday();
  const { data, isLoading, error } = useAnalyticsSummary(today);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-[var(--ink-400)]" />
        <p className="font-body text-[15px] text-[var(--ink-500)]">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card level={1} className="p-4">
        <p className="font-body text-[15px] text-semantic-red">Failed to load analytics.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="size-6 text-[var(--ink-900)]" />
        <h1 className="font-display text-2xl font-bold text-[var(--ink-900)]">Analytics</h1>
      </div>

      {/* Scores */}
      {data && <ScoreSection data={data} />}

      {/* Two-column layout */}
      <div className="grid gap-6 sm:grid-cols-2">
        <PlannedVsActualSection />
        <TimeDistributionSection />
      </div>

      {/* Trend */}
      <TrendSection />
    </div>
  );
}
