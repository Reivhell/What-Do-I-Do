import { Insight } from '@whatdo/shared';
import { SeverityBadge } from './SeverityBadge';

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins}m lalu`;
  if (diffHours < 24) return `${diffHours}j lalu`;
  if (diffDays < 7) return `${diffDays}h lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const severityBorderColors = {
    info: 'border-l-4 border-[var(--blue-500)]',
    warning: 'border-l-4 border-[var(--semantic-amber)]',
    risk: 'border-l-4 border-[var(--semantic-red)]',
  };

  return (
    <div
      className={`
        clay-level-1 rounded-[var(--radius-lg)] p-5 flex items-start gap-4
        transition-all duration-180 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        hover:clay-level-2 hover:-translate-y-0.5
        active:clay-pressed active:translate-y-0
        ${severityBorderColors[insight.severity]}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <SeverityBadge severity={insight.severity} />
          <time className="font-[Inter] text-[12px] leading-[16px] text-[var(--ink-500)]">
            {formatRelativeTime(insight.generatedAt)}
          </time>
        </div>
        <p className="font-[Inter] text-[14px] leading-[20px] text-[var(--ink-900)]">
          {insight.message}
        </p>
        {insight.sourceMetric && (
          <a
            href={`/analytics/snapshot/${insight.sourceMetric}`}
            className="font-[Inter] text-[12px] leading-[16px] font-medium text-[var(--blue-500)] hover:underline mt-2 inline-block"
          >
            Lihat snapshot sumber →
          </a>
        )}
      </div>
      <button
        onClick={() => onDismiss(insight.id)}
        className="clay-level-1 rounded-full p-2 text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:clay-level-2 active:clay-pressed transition-all duration-180 shrink-0"
        aria-label="Dismiss insight"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}