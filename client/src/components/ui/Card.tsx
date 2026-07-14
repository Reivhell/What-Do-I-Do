import { type HTMLAttributes, type ReactNode } from "react";

type Level = 1 | 2;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  level?: Level;
  children: ReactNode;
}

const levelStyles: Record<Level, string> = {
  1: "clay-l1",
  2: "clay-l2",
};

export function Card({
  level = 1,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[--radius-lg] bg-clay-surface p-5 clay-transition ${levelStyles[level]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Card Header (optional structured header inside card) ── */
export function CardHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-4 flex items-start justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Card Title ── */
export function CardTitle({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display text-lg font-semibold text-ink-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}
