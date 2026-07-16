import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center font-body font-semibold tap-target clay-transition select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--blue-500)] text-white clay-l1 hover:clay-l2 hover:-translate-y-[1px] active:clay-pressed active:translate-y-0",
  secondary:
    "bg-[var(--clay-surface)] text-[var(--blue-700)] border border-[var(--blue-100)] clay-l1 hover:clay-l2 hover:-translate-y-[1px] active:clay-pressed active:translate-y-0",
  destructive:
    "bg-[var(--clay-surface)] text-[var(--semantic-red)] border border-[var(--blue-100)] clay-l1 hover:clay-l2 hover:-translate-y-[1px] active:clay-pressed active:translate-y-0",
  ghost:
    "bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--blue-50)]/50 active:bg-[var(--blue-50)] active:clay-pressed",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 text-[15px] gap-2",
  lg: "px-8 py-4 text-base gap-2",
};

function Spinner() {
  return (
    <span
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/* ── FAB (Quick Capture) — single FAB across app ── */
interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function FAB({ className = "", children, ...props }: FABProps) {
  return (
    <button
      className={`tap-target clay-transition fixed bottom-8 right-8 z-50 flex size-14 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--blue-500)] text-white clay-l2 hover:clay-l2 hover:-translate-y-[2px] active:clay-pressed active:translate-y-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
