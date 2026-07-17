import { useState } from 'react';
import {
  Lightbulb, Loader2, LightbulbOff, Filter, X,
  Clock, BrainCircuit, TrendingUp, Wallet, CheckCircle2, Target,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, EmptyState } from '../components/ui';
import { useInsights, useDismissInsight, useWeeklySummary } from '../api/insights';
import { InsightCard } from '../components/insights/InsightCard';
import { WeeklySummaryCard } from '../components/insights/WeeklySummaryCard';
import type { InsightType } from '@whatdo/shared';

const INSIGHT_FILTERS: { value: InsightType | 'all'; label: string; icon: typeof Lightbulb }[] = [
  { value: 'all', label: 'Semua', icon: Lightbulb },
  { value: 'productivity', label: 'Produktivitas', icon: BrainCircuit },
  { value: 'time', label: 'Waktu', icon: Clock },
  { value: 'habit', label: 'Kebiasaan', icon: CheckCircle2 },
  { value: 'money', label: 'Uang', icon: Wallet },
  { value: 'task', label: 'Tugas', icon: Target },
  { value: 'goal', label: 'Target', icon: TrendingUp },
];

export function InsightsPage() {
  const [activeType, setActiveType] = useState<InsightType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: insights, isLoading } = useInsights(activeType === 'all' ? undefined : activeType);
  const { data: weeklySummary } = useWeeklySummary();
  const dismissInsight = useDismissInsight();

  const handleDismiss = (id: string) => dismissInsight.mutate(id);

  const filtered = insights?.filter((i) =>
    !search || i.message.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-900)]">Insights</h1>
          <p className="font-body text-[14px] text-[var(--ink-500)] mt-1">
            Interpretasi dan rekomendasi dari data yang terkumpul
          </p>
        </div>
      </div>

      {/* Weekly Summary */}
      {weeklySummary && <WeeklySummaryCard summary={weeklySummary} />}

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {INSIGHT_FILTERS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setActiveType(value)}
              className={`inline-flex items-center gap-1.5 rounded-[--radius-pill] px-3 py-1.5 font-body text-[13px] font-medium transition-all duration-150 clay-l1 focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${
                activeType === value
                  ? 'bg-[var(--blue-500)] text-white'
                  : 'bg-clay-surface text-[var(--ink-500)] hover:bg-[var(--blue-50)] hover:text-[var(--ink-900)]'
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-0 sm:w-56">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari insight..."
            className="w-full rounded-[--radius-md] bg-clay-surface px-3 py-2 pl-9 font-body text-[14px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] outline-none focus:ring-2 focus:ring-[var(--blue-200)] transition-shadow"
          />
          {search ? (
            <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-600)]">
              <X className="size-4" />
            </button>
          ) : (
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[var(--ink-400)]" />
          )}
        </div>
      </div>

      {/* Insight list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-[var(--blue-400)]" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} />
          ))
        ) : (
          <EmptyState
            icon={<LightbulbOff className="size-10 text-[var(--ink-300)]" />}
            title="Belum ada insight"
            description={search ? 'Tidak ada insight yang cocok dengan pencarian.' : 'Kumpulkan lebih banyak data untuk mulai mendapat insight tentang produktivitas dan kebiasaanmu.'}
          />
        )}
      </div>
    </div>
  );
}
