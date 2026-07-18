import { describe, it, expect } from 'vitest';
import type { Habit, HabitLog, CreateHabitInput, HabitWithLogs } from '../../src/types/habits';

describe('Habit types', () => {
  it('should create valid Habit', () => {
    const habit: Habit = {
      id: '1', userId: 'u1', name: 'Read',
      targetFrequency: 'daily',
      repeatRule: { freq: 'daily', interval: 1 },
      currentStreak: 3, bestStreak: 10,
      completionCount: 30, missedCount: 5,
      notes: null, linkedGoalId: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(habit.name).toBe('Read');
    expect(habit.targetFrequency).toBe('daily');
  });

  it('should create weekly habit with daysOfWeek', () => {
    const habit: Habit = {
      id: '2', userId: 'u1', name: 'Gym',
      targetFrequency: 'weekly',
      repeatRule: { freq: 'weekly', interval: 1, daysOfWeek: [1, 3, 5] },
      currentStreak: 0, bestStreak: 0,
      completionCount: 0, missedCount: 0,
      notes: 'MWF', linkedGoalId: 'g1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(habit.repeatRule.daysOfWeek).toEqual([1, 3, 5]);
  });

  it('should create HabitLog', () => {
    const log: HabitLog = {
      id: 'l1', habitId: '1', date: '2026-01-15',
      status: 'done',
      linkedEventId: null, linkedSessionId: null,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    };
    expect(log.status).toBe('done');
  });

  it('should create HabitWithLogs', () => {
    const h: HabitWithLogs = {
      id: '1', userId: 'u1', name: 'Read',
      targetFrequency: 'daily',
      repeatRule: { freq: 'daily', interval: 1 },
      currentStreak: 0, bestStreak: 0,
      completionCount: 0, missedCount: 0,
      notes: null, linkedGoalId: null,
      createdAt: '', updatedAt: '',
      logs: [{ id: 'l1', habitId: '1', date: '2026-01-15', status: 'done', linkedEventId: null, linkedSessionId: null, createdAt: '', updatedAt: '' }],
    };
    expect(h.logs).toHaveLength(1);
  });

  it('should create CreateHabitInput with optional fields omitted', () => {
    const input: CreateHabitInput = {
      name: 'Test', targetFrequency: 'daily',
      repeatRule: { freq: 'daily', interval: 1 },
    };
    expect(input.notes).toBeUndefined();
  });
});
