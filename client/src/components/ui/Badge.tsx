import { type HTMLAttributes, type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--blue-50)] text-[var(--blue-600)] dark:bg-[var(--blue-900)]/30 dark:text-[var(--blue-300)]",
  success: "bg-[var(--semantic-green)]/15 text-[var(--semantic-green)] dark:bg-[var(--semantic-green)]/20 dark:text-[var(--semantic-green)]",
  warning: "bg-[var(--semantic-amber)]/15 text-[var(--semantic-amber)] dark:bg-[var(--semantic-amber)]/20 dark:text-[var(--semantic-amber)]",
  danger: "bg-[var(--semantic-red)]/15 text-[var(--semantic-red)] dark:bg-[var(--semantic-red)]/20 dark:text-[var(--semantic-red)]",
  info: "bg-[var(--blue-50)] text-[var(--ink-500)] dark:bg-[var(--blue-900)]/30 dark:text-[var(--blue-300)]",
  outline: "border border-[var(--clay-border)] bg-transparent text-[var(--ink-500)] dark:text-[var(--ink-500)] dark:border-[var(--clay-border)]",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-sm)] px-[10px] py-[4px] font-body text-[12px] font-semibold ${variantStyles[variant]} ${className}`}
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
  success: "bg-[var(--semantic-green)]",
  warning: "bg-[var(--semantic-amber)]",
  danger: "bg-[var(--semantic-red)]",
  inactive: "bg-[var(--ink-300)]",
};

export function StatusDot({ variant = "inactive" }: StatusDotProps) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${dotStyles[variant]}`}
      aria-hidden="true"
    />
  );
}
