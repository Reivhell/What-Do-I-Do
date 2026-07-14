import type { ReactNode } from "react";
import type { GridSpan } from "../types";

/* ── Props ── */
interface WidgetCardProps {
  children: ReactNode;
  span?: GridSpan;
  padding?: "default" | "compact";
  relative?: boolean;
  className?: string;
}

/* ── Tailwind v4 grid-span lookup (static keys → dynamic Tailwind breaks) ── */
const SPAN_CLASS: Record<GridSpan, string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  12: "lg:col-span-12",
};

/* ── Reusable clay-card wrapper ── */
export function WidgetCard({
  children,
  span,
  padding = "default",
  relative = false,
  className = "",
}: WidgetCardProps) {
  const classes = [
    "clay-card",
    padding === "default" ? "p-[24px]" : "p-[20px]",
    span ? SPAN_CLASS[span] : undefined,
    relative ? "relative overflow-hidden" : undefined,
    className || undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return <section className={classes}>{children}</section>;
}
