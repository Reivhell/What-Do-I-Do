import { useInsights, useDismissInsight } from '../../api/insights';
import { SeverityBadge } from '../insights/SeverityBadge';

export function TopInsightWidget() {
  const { data: insights } = useInsights(undefined, true, 1);
  const dismissMutation = useDismissInsight();

  const topInsight = insights?.[0];

  if (!topInsight) return null;

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id);
  };

  return (
    <section className="clay-level-2 rounded-[var(--radius-lg)] p-6 lg:col-span-3">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">
          Insight Teratas
        </h4>
        <SeverityBadge severity={topInsight.severity} />
      </div>
      <p className="font-body text-[15px] leading-[22px] text-[var(--ink-900)] mb-4">
        {topInsight.message}
      </p>
      <div className="flex items-center gap-3">
        <button className="clay-button bg-[var(--blue-50)] text-[var(--blue-700)] rounded-[var(--radius-md)] px-4 py-2 font-body text-[12px] leading-[16px] font-medium">
          Lihat Detail
        </button>
        <button
          onClick={() => handleDismiss(topInsight.id)}
          className="clay-level-1 rounded-full p-2 text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:clay-level-2 active:clay-pressed transition-all duration-180"
          aria-label="Dismiss insight"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </section>
  );
}