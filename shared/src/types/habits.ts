// @whatdo/shared — Habits types

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type HabitLogStatus = 'done' | 'skipped' | 'missed';

export interface RepeatRule {
  freq: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endCondition?: { type: 'count'; count: number } | { type: 'date'; date: string };
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  targetFrequency: HabitFrequency;
  repeatRule: RepeatRule;
  currentStreak: number;
  bestStreak: number;
  completionCount: number;
  missedCount: number;
  notes: string | null;
  linkedGoalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: HabitLogStatus;
  linkedEventId: string | null;
  linkedSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitInput {
  name: string;
  targetFrequency: HabitFrequency;
  repeatRule: RepeatRule;
  notes?: string;
  linkedGoalId?: string;
}

export interface UpdateHabitInput {
  name?: string;
  targetFrequency?: HabitFrequency;
  repeatRule?: RepeatRule;
  notes?: string;
  linkedGoalId?: string | null;
}

export interface LogHabitInput {
  date: string;
  status: HabitLogStatus;
  linkedEventId?: string;
  linkedSessionId?: string;
}

export interface HabitWithLogs extends Habit {
  logs: HabitLog[];
}
