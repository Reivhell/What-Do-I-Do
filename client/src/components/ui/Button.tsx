import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center font-body font-semibold tap-target clay-transition select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-500 text-white clay-l1 hover:clay-l2 hover:-translate-y-[1px] active:clay-pressed active:translate-y-0",
  secondary:
    "bg-clay-surface text-blue-700 border border-blue-100 clay-l1 hover:clay-l2 hover:-translate-y-[1px] active:clay-pressed active:translate-y-0",
  destructive:
    "bg-clay-surface text-semantic-red border border-blue-100 clay-l1 hover:clay-l2 hover:-translate-y-[1px] active:clay-pressed active:translate-y-0",
  ghost:
    "bg-transparent text-ink-500 hover:text-ink-900 hover:bg-blue-50/50 active:bg-blue-50",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 text-[15px] gap-2",
  lg: "px-8 py-4 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
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
      className={`tap-target clay-transition fixed bottom-8 right-8 z-50 flex size-14 items-center justify-center rounded-[--radius-pill] bg-blue-500 text-white clay-l2 hover:clay-l2 hover:-translate-y-[2px] active:clay-pressed active:translate-y-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
