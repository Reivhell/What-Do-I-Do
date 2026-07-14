/* ── Grid span options for bento layout ── */
export type GridSpan = 2 | 3 | 4 | 5 | 12;

/* ── Habit data shape ── */
export interface HabitItem {
  name: string;
  icon: string;
  progress: number;
  streak: number;
  days: number[];
  color: string;
  bg: string;
}

/* ── Plan item shape ── */
export interface PlanItem {
  time: string;
  label: string;
  icon: string;
  color: string;
  fill: number;
  bold?: boolean;
}

/* ── Summary item shape ── */
export interface SummaryItem {
  icon: string;
  label: string;
  val: string;
  bg: string;
  text: string;
}

/* ── Plan-vs-actual row ── */
export interface PlanVsActualRow {
  cat: string;
  planned: string;
  actual: string;
  diff: string;
}

/* ── Quick action shape ── */
export interface QuickAction {
  icon: string;
  label: string;
  color: string;
}
