import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] bg-clay-surface p-8 py-16 text-center clay-l1">
      <div className="flex size-20 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--blue-50)] text-[var(--blue-300)] dark:bg-[var(--blue-900)]/30">
        {icon}
      </div>
      <div className="max-w-[280px]">
        <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
          {title}
        </p>
        <p className="mt-1 font-body text-[15px] text-[var(--ink-500)]">
          {description}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
