export type PlannerStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
export type SourceType = 'manual' | 'task' | 'habit' | 'goal_milestone';
export type ViewRange = 'daily' | '3days' | 'weekly' | 'monthly';

export interface RepeatRule {
  freq: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endCondition?: { type: 'count'; count: number } | { type: 'date'; date: string };
}

export interface PlannerEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  category: string | null;
  priority: string;
  notes: string | null;
  repeatRule: RepeatRule | null;
  reminderTime: string | null;
  sourceType: SourceType;
  sourceId: string | null;
  status: PlannerStatus;
  realizedSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlannerEvent {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  category?: string;
  priority?: string;
  notes?: string;
  reminderTime?: string;
  repeatRule?: RepeatRule;
}

export interface UpdatePlannerEvent {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  category?: string;
  priority?: string;
  notes?: string;
  status?: PlannerStatus;
}
