export interface ActiveSession {
  isActive: boolean;
  activityName?: string;
  elapsedSeconds?: number;
  sessionId?: string;
}

export interface TodayStats {
  tasksCompleted: number;
  tasksTotal: number;
  minutesTracked: number;
  expenseToday: number;
  incomeToday: number;
  habitsDone: number;
  habitsTotal: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  time: string;
  duration?: number;
}

export interface DashboardScores {
  discipline: number | null;
  focus: number | null;
  consistency: number | null;
}

export interface TopInsight {
  message: string;
  type: string;
}

export interface StreakInfo {
  current: number;
  best: number;
}

export interface DashboardSummary {
  activeSession: ActiveSession | null;
  todayStats: TodayStats;
  upcomingEvents: UpcomingEvent[];
  scores: DashboardScores;
  topInsight: TopInsight | null;
  streak: StreakInfo;
}
