import { type HTMLAttributes, type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  success: "bg-semantic-green/15 text-semantic-green dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-semantic-amber/15 text-semantic-amber dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-semantic-red/15 text-semantic-red dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-50 text-ink-500 dark:bg-blue-900/30 dark:text-blue-300",
  outline: "border brd-clr-divider-soft bg-transparent text-ink-600 dark:text-ink-400 dark:border-zinc-700",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[--radius-sm] px-[10px] py-[4px] font-body text-[12px] font-semibold ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

/* ── Status Dot (only for real semantic state) ── */
interface StatusDotProps {
  variant?: "success" | "warning" | "danger" | "inactive";
}

const dotStyles: Record<string, string> = {
  success: "bg-semantic-green",
  warning: "bg-semantic-amber",
  danger: "bg-semantic-red",
  inactive: "bg-ink-300",
};

export function StatusDot({ variant = "inactive" }: StatusDotProps) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${dotStyles[variant]}`}
      aria-hidden="true"
    />
  );
}
