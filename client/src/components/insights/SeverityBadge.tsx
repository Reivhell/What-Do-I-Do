import { InsightSeverity } from '@whatdo/shared';

const severityStyles: Record<InsightSeverity, string> = {
  info: 'bg-[var(--blue-50)] text-[var(--blue-700)]',
  warning: 'bg-[var(--semantic-amber)]/15 text-[var(--semantic-amber)]',
  risk: 'bg-[var(--semantic-red)]/15 text-[var(--semantic-red)]',
};

const severityLabels: Record<InsightSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  risk: 'Risk',
};

interface SeverityBadgeProps {
  severity: InsightSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  return (
    <span
      className={`
        font-[Plus_Jakarta_Sans] text-[11px] leading-[14px] font-semibold
        px-2.5 py-0.5 rounded-[var(--radius-pill)]
        ${severityStyles[severity]} ${className}
      `}
    >
      {severityLabels[severity]}
    </span>
  );
}