import { WeeklySummary } from '@whatdo/shared';
import { SeverityBadge } from './SeverityBadge';

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const insights = Object.values(summary.byType).filter(Boolean) as (typeof summary.byType.time)[];

  if (insights.length === 0) {
    return (
      <section className="clay-level-2 rounded-[var(--radius-lg)] p-6">
        <h3 className="font-[Quicksand] text-[18px] leading-[26px] font-semibold text-[var(--ink-900)] mb-4">
          Ringkasan Mingguan
        </h3>
        <p className="font-[Inter] text-[14px] leading-[20px] text-[var(--ink-500)] text-center py-4">
          Belum ada insight minggu ini. Data akan muncul setelah snapshot Analytics berikutnya.
        </p>
      </section>
    );
  }

  return (
    <section className="clay-level-2 rounded-[var(--radius-lg)] p-6">
      <h3 className="font-[Quicksand] text-[18px] leading-[26px] font-semibold text-[var(--ink-900)] mb-4">
        Ringkasan Mingguan
      </h3>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight?.id}
            className="clay-level-1 rounded-[var(--radius-md)] p-3 flex items-center gap-3"
          >
            <SeverityBadge severity={insight!.severity} />
            <p className="font-[Inter] text-[14px] leading-[20px] text-[var(--ink-900)] flex-1">
              {insight!.message}
            </p>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 clay-button bg-[var(--clay-surface)] text-[var(--blue-700)] border border-[var(--blue-100)] rounded-[var(--radius-md)] py-3 font-[Plus_Jakarta_Sans] text-[13px] leading-[18px] font-medium">
        Lihat Semua Insight
      </button>
    </section>
  );
}