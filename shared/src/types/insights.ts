export type InsightType = 'time' | 'habit' | 'productivity' | 'money' | 'task' | 'goal';
export type InsightSeverity = 'info' | 'warning' | 'risk';

export interface Insight {
  id: string;
  userId: string;
  type: InsightType;
  message: string;
  severity: InsightSeverity;
  sourceMetric: string | null;
  generatedAt: string;
  dismissed: boolean;
}

export interface WeeklySummary {
  byType: Record<InsightType, Insight | null>;
  topInsight: Insight | null;
  generatedAt: string;
}