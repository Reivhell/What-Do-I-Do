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
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-[--radius-xl] bg-blue-50 text-blue-300">
        {icon}
      </div>
      <div className="max-w-[280px]">
        <p className="font-display text-lg font-semibold text-ink-900">
          {title}
        </p>
        <p className="mt-1 font-body text-[15px] text-ink-500">
          {description}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
