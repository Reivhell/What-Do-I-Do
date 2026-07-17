import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { HabitCard } from './HabitCard';
import type { Habit } from '@whatdo/shared';

const baseHabit: Habit = {
  id: 'habit-1',
  userId: 'user-1',
  name: 'Morning Run',
  targetFrequency: 'daily',
  repeatRule: { freq: 'daily', interval: 1 },
  currentStreak: 5,
  bestStreak: 12,
  completionCount: 30,
  missedCount: 5,
  notes: null,
  linkedGoalId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('HabitCard', () => {
  const onLog = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  it('renders the habit name', () => {
    render(
      <HabitCard habit={baseHabit} onLog={onLog} onEdit={onEdit} onDelete={onDelete} />,
    );
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('renders streak information', () => {
    render(
      <HabitCard habit={baseHabit} onLog={onLog} onEdit={onEdit} onDelete={onDelete} />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders completion rate', () => {
    render(
      <HabitCard habit={baseHabit} onLog={onLog} onEdit={onEdit} onDelete={onDelete} />,
    );
    // 30 completions / (30+5) = 86%, rendered by HabitStreakDisplay
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('30/35')).toBeInTheDocument();
  });

  it('renders frequency label as Daily', () => {
    render(
      <HabitCard habit={baseHabit} onLog={onLog} onEdit={onEdit} onDelete={onDelete} />,
    );
    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('renders without errors when todayLog is provided', () => {
    render(
      <HabitCard
        habit={baseHabit}
        todayLog="done"
        onLog={onLog}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('renders with notes when provided', () => {
    const habitWithNotes = { ...baseHabit, notes: 'Run at least 2km' };
    render(
      <HabitCard habit={habitWithNotes} onLog={onLog} onEdit={onEdit} onDelete={onDelete} />,
    );
    expect(screen.getByText('Run at least 2km')).toBeInTheDocument();
  });
});
