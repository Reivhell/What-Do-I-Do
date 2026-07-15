import { Card } from '../ui/Card';
import type { Insight, WeeklySummary } from '@whatdo/shared';

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
}

const TYPE_ICONS: Record<string, string> = {
  time: '⏰',
  habit: '🔄',
  productivity: '📈',
  money: '💰',
  task: '✓',
  goal: '🎯',
};

const TYPE_LABELS: Record<string, string> = {
  time: 'Waktu',
  habit: 'Kebiasaan',
  productivity: 'Produktivitas',
  money: 'Uang',
  task: 'Tugas',
  goal: 'Target',
};

function hasContent(summary: WeeklySummary): boolean {
  return Object.values(summary.byType).some((v) => v !== null);
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  if (!hasContent(summary)) {
    return (
      <Card level={1}>
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-1">Ringkasan Mingguan</h3>
        <p className="font-body text-[14px] leading-[1.6] text-ink-400">
          Belum ada insight minggu ini. Data akan muncul setelah snapshot Analytics berikutnya.
        </p>
      </Card>
    );
  }

  const entries = Object.entries(summary.byType).filter(
    (e): e is [string, NonNullable<Insight>] => e[1] !== null
  );

  return (
    <Card level={1}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-ink-900">Ringkasan Mingguan</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entries.map(([type, insight]) => (
          <div
            key={insight.id}
            className="rounded-[--radius-md] bg-clay-surface-alt p-3 clay-l1 transition-all duration-150 hover:clay-l2"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{TYPE_ICONS[type] ?? '💡'}</span>
              <span className="font-body text-[12px] font-semibold text-ink-500 uppercase tracking-[0.03em]">
                {TYPE_LABELS[type] ?? type}
              </span>
            </div>
            <p className="font-body text-[13px] leading-[1.5] text-ink-900 line-clamp-2">
              {insight.message}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
