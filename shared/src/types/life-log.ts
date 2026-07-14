// @whatdo/shared — Life Log types

export type TimelineSourceType = 'activity' | 'planner' | 'transaction' | 'habit' | 'annotation';

export interface LifeLogAnnotation {
  id: string;
  userId: string;
  timestamp: string;
  title: string;
  description: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnotationInput {
  timestamp: string;
  title: string;
  description?: string;
  note?: string;
}

export interface UpdateAnnotationInput {
  timestamp?: string;
  title?: string;
  description?: string;
  note?: string;
}

export interface TimelineItem {
  source: TimelineSourceType;
  id: string;
  timestamp: string;
  title: string;
  description: string | null;
  // Source-specific metadata
  durationMinutes?: number | null;       // activity
  category?: string | null;              // activity / planner / transaction
  amount?: number | null;                // transaction
  type?: string | null;                  // transaction (income/expense/transfer)
  status?: string | null;                // planner (completed) / habit (done/skipped/missed)
  note?: string | null;                  // annotation
  sourceType?: string | null;            // planner (manual/task/habit/goal_milestone)
}

export interface DailySummary {
  date: string;
  totalActivities: number;
  totalPlannerEvents: number;
  totalTransactions: number;
  totalHabitLogs: number;
  totalAnnotations: number;
  total: number;
}

export interface TimelineFilter {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  sources?: TimelineSourceType[];
  search?: string;
}
