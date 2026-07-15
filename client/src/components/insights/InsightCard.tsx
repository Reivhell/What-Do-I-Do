import { X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Insight } from '@whatdo/shared';

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

const SEVERITY_CONFIG: Record<string, { variant: 'info' | 'warning' | 'danger'; label: string }> = {
  info: { variant: 'info', label: 'Info' },
  warning: { variant: 'warning', label: 'Warning' },
  risk: { variant: 'danger', label: 'Risk' },
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const config = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.info;

  return (
    <Card level={1} className="group !p-4 transition-all duration-150 hover:clay-l2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={config.variant}>{config.label}</Badge>
            <time className="font-body text-[12px] text-ink-500">
              {formatRelativeTime(insight.generatedAt)}
            </time>
          </div>
          <p className="font-body text-[14px] leading-[1.6] text-ink-900">
            {insight.message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(insight.id)}
          className="shrink-0 flex size-7 items-center justify-center rounded-[--radius-sm] text-ink-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
          title="Tutup insight"
        >
          <X className="size-4" />
        </button>
      </div>
    </Card>
  );
}
