import type { InsightSeverity } from '@whatdo/shared';

const severityStyles: Record<InsightSeverity, string> = {
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-semantic-amber/15 text-semantic-amber',
  risk: 'bg-semantic-red/15 text-semantic-red',
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
      className={`inline-flex items-center rounded-[--radius-sm] px-2.5 py-0.5 font-body text-[11px] font-semibold ${severityStyles[severity]} ${className}`}
    >
      {severityLabels[severity]}
    </span>
  );
}
