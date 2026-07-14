export interface OverviewStats {
  totalActivitySessions: number;
  totalHoursTracked: number;
  totalTasks: number;
  totalCompletedTasks: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  totalHabits: number;
  totalHabitCompletions: number;
  totalGoals: number;
  totalCompletedGoals: number;
  totalMilestones: number;
  totalCompletedMilestones: number;
}

export interface TimeStats {
  totalHoursTracked: number;
  averageSessionMinutes: number;
  longestSessionMinutes: number;
  sessionsPerDayAverage: number;
  mostActiveDayOfWeek: string | null;
}

export interface ActivityStatEntry {
  activityName: string;
  category: string;
  totalSessions: number;
  totalMinutes: number;
}

export interface ActivityStats {
  mostFrequentActivity: string | null;
  longestSessionMinutes: number;
  sessionsByActivity: ActivityStatEntry[];
}

export interface MoneyStatEntry {
  category: string;
  amount: number;
}

export interface MoneyStats {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalTransactions: number;
  biggestIncome: { amount: number; date: string; notes: string | null } | null;
  biggestExpense: { amount: number; date: string; notes: string | null; category: string } | null;
  incomeByCategory: MoneyStatEntry[];
  expenseByCategory: MoneyStatEntry[];
}

export interface HabitEntry {
  name: string;
  completionRate: number;
  bestStreak: number;
  currentStreak: number;
}

export interface HabitStats {
  totalHabits: number;
  bestStreak: number;
  bestStreakHabitName: string | null;
  totalCompletions: number;
  totalMissed: number;
  mostConsistentHabit: { name: string; completionRate: number } | null;
  habits: HabitEntry[];
}

export interface GoalEntry {
  title: string;
  status: string;
  progressPercent: number;
  milestoneCount: number;
  completedMilestoneCount: number;
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  atRiskGoals: number;
  averageProgressPercent: number;
  totalMilestones: number;
  completedMilestones: number;
  goals: GoalEntry[];
}
