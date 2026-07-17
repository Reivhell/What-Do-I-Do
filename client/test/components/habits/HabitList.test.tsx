import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HabitList } from '../../../src/components/habits/HabitList';
import type { Habit, HabitLogStatus } from '@whatdo/shared';

const habit: Habit = {
  id: 'h1',
  userId: 'u1',
  name: 'Exercise',
  targetFrequency: 'daily',
  repeatRule: { freq: 'daily', interval: 1 },
  currentStreak: 0,
  bestStreak: 5,
  completionCount: 10,
  missedCount: 2,
  notes: null,
  linkedGoalId: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('HabitList', () => {
  it('renders list of habits', () => {
    render(<HabitList habits={[habit]} todayLogs={{}} onLog={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText('Exercise')).toBeInTheDocument();
  });

  it('shows empty state when no habits', () => {
    render(<HabitList habits={[]} todayLogs={{}} onLog={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText('No habits yet')).toBeInTheDocument();
  });
});
