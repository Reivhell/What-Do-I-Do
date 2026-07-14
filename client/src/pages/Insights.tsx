import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout';
import { useInsights, useDismissInsight, useWeeklySummary } from '../api/insights';
import { InsightCard } from '../components/insights/InsightCard';
import { WeeklySummaryCard } from '../components/insights/WeeklySummaryCard';
import { InsightType } from '@whatdo/shared';

const INSIGHT_TYPES: { value: InsightType | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'productivity', label: 'Produktivitas' },
  { value: 'time', label: 'Waktu' },
  { value: 'habit', label: 'Kebiasaan' },
  { value: 'money', label: 'Uang' },
  { value: 'task', label: 'Tugas' },
  { value: 'goal', label: 'Target' },
];

export function InsightsPage() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<InsightType | 'all'>('all');

  const { data: insights, isLoading } = useInsights(activeType === 'all' ? undefined : activeType);
  const { data: weeklySummary } = useWeeklySummary();
  const dismissInsight = useDismissInsight();

  const handleDismiss = (id: string) => {
    dismissInsight.mutate(id);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-[230px] p-8 flex-1 bg-[var(--clay-bg)] text-[var(--ink-900)]">
        {/* Header */}
        <header className="flex items-center justify-between w-full mb-10 gap-[16px] h-20">
          <div className="flex-1 max-w-xl">
            <div className="relative clay-card-inset rounded-full flex items-center px-6 py-3">
              <span className="material-symbols-outlined text-[var(--ink-500)] mr-3">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-[Plus_Jakarta_Sans] text-[14px] leading-[20px] font-normal text-[var(--ink-900)] placeholder:text-[var(--ink-500)]"
                placeholder="Cari insight..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="clay-button bg-[var(--clay-surface)] dark:bg-[var(--surface-container-high)] rounded-full p-3 flex items-center gap-2 font-[Plus_Jakarta_Sans] text-[13px] leading-[18px] font-medium text-[var(--ink-900)]">
              <span className="material-symbols-outlined text-[var(--blue-500)]">inbox</span>
              <span className="hidden sm:inline">Inbox</span>
              <span className="w-2 h-2 bg-[var(--blue-500)] rounded-full" />
            </button>
            <button className="clay-button bg-[var(--blue-500)] text-white rounded-full px-6 py-3 flex items-center gap-2 font-[Plus_Jakarta_Sans] text-[16px] leading-[24px] font-semibold hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">add_circle</span>
              Capture
            </button>

            <div
              className="clay-card-inset rounded-full p-1 flex items-center gap-1 relative cursor-pointer hover:scale-105 transition-all duration-200"
            >
              <div className="absolute w-8 h-8 bg-[var(--blue-500)] rounded-full transition-all duration-300 shadow-sm translate-x-0" />
              <button className="relative z-10 w-8 h-8 flex items-center justify-center text-[var(--ink-900)]">
                <span className="material-symbols-outlined text-xl">light_mode</span>
              </button>
              <button className="relative z-10 w-8 h-8 flex items-center justify-center text-[var(--ink-500)]">
                <span className="material-symbols-outlined text-xl">dark_mode</span>
              </button>
            </div>

            <div className="relative">
              <button className="clay-button bg-[var(--clay-surface)] dark:bg-[var(--surface-container-high)] rounded-full p-3 text-[var(--ink-900)]">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <span className="absolute top-0 right-0 w-5 h-5 bg-[var(--semantic-red)] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-[var(--clay-bg)] font-bold">
                3
              </span>
            </div>

            <div className="flex items-center gap-3 clay-button bg-[var(--clay-surface)] dark:bg-[var(--surface-container-high)] rounded-full pl-2 pr-4 py-2 cursor-pointer">
              <img
                className="w-10 h-10 rounded-full object-cover shadow-sm"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGDEjK23si4By4wAO5X74kXUtpuOEhoVox6q_X-tX5YJJpU5Yx-VOMKOhf6PRwsmIko_8ShwiIxXdcE0vviUgtY3RcnoVl454Z_3DhFuusTLw0aZiRaTdIRLdRKM8NIfByCpzPZByLRc63hy-PbG7EEFnswYPdudrReoN5Wzj3EcRsyDggJ-lx1-gYnY1AxuJm6ssUwYcsUTZ6jHiI10wRO64mN369SVo1qlN2mnyWTUF64z0Rzvzcc9uEk25OymvfnFS7etBX1QyR"
                alt="User"
              />
              <div className="hidden lg:block text-left">
                <p className="font-[Plus_Jakarta_Sans] text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">Fajar</p>
              </div>
              <span className="material-symbols-outlined text-[var(--ink-500)]">keyboard_arrow_down</span>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-[Quicksand] text-[28px] leading-[36px] font-bold tracking-tight text-[var(--ink-900)]">
            Insights
          </h1>
          <p className="font-[Plus_Jakarta_Sans] text-[16px] leading-[24px] font-normal text-[var(--ink-500)] mt-1">
            Rekomendasi dan interpretasi dari pola data Anda
          </p>
        </div>

        {/* Type Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {INSIGHT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`
                clay-button rounded-[var(--radius-pill)] px-4 py-2
                font-[Plus_Jakarta_Sans] text-[13px] leading-[18px] font-medium
                transition-all duration-180
                ${activeType === type.value
                  ? 'bg-[var(--blue-500)] text-white shadow-[0_4px_12px_rgba(74,144,226,0.3)]'
                  : 'bg-[var(--clay-surface)] dark:bg-[var(--surface-container-high)] text-[var(--ink-900)] hover:bg-[var(--blue-50)] dark:hover:bg-[var(--blue-50)]'
                }
              `}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weekly Summary - spans 4 cols */}
          <div className="lg:col-span-4">
            {weeklySummary && <WeeklySummaryCard summary={weeklySummary} />}
          </div>

          {/* Insights List - spans 8 cols */}
          <div className="lg:col-span-8 space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="clay-level-1 rounded-[var(--radius-lg)] p-5 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-[var(--blue-100)] rounded w-1/4" />
                  <div className="h-4 bg-[var(--blue-100)] rounded w-3/4" />
                </div>
              ))
            ) : insights && insights.length > 0 ? (
              insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} />
              ))
            ) : (
              <div className="clay-level-1 rounded-[var(--radius-lg)] p-12 text-center">
                <div className="w-16 h-16 bg-[var(--blue-50)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[var(--blue-300)] text-4xl">lightbulb</span>
                </div>
                <h3 className="font-[Quicksand] text-[18px] leading-[26px] font-semibold text-[var(--ink-900)] mb-2">
                  Belum ada insight
                </h3>
                <p className="font-[Inter] text-[14px] leading-[20px] text-[var(--ink-500)] max-w-md mx-auto">
                  Insight akan muncul setelah Analytics snapshot berikutnya dijalankan (setiap hari pukul 01:00).
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}