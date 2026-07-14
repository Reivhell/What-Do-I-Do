export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: 'active' | 'completed' | 'archived' | 'at_risk';
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetDate: string | null;
  isCompleted: boolean;
  generatedEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetDate?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  targetDate?: string | null;
  status?: 'active' | 'completed' | 'archived' | 'at_risk';
  progressPercent?: number;
}

export interface CreateMilestoneInput {
  title: string;
  targetDate?: string;
}

export interface UpdateMilestoneInput {
  title?: string;
  targetDate?: string | null;
  isCompleted?: boolean;
}

export interface ScheduleMilestoneInput {
  date: string;
  startTime: string;
  endTime: string;
}

export interface LinkedItem {
  type: 'habit' | 'task';
  id: string;
  title: string;
}
