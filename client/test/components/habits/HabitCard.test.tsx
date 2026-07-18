import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HabitCard } from '../../../src/components/habits/HabitCard';
import type { Habit, HabitLogStatus } from '@whatdo/shared';

const baseHabit: Habit = {
  id: 'habit-1',
  userId: 'user-1',
  name: 'Read 30 mins',
  targetFrequency: 'daily',
  repeatRule: { freq: 'daily', interval: 1 },
  currentStreak: 3,
  bestStreak: 10,
  completionCount: 20,
  missedCount: 5,
  notes: 'Before bed',
  linkedGoalId: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('HabitCard', () => {
  it('renders habit name and frequency', () => {
    render(<HabitCard habit={baseHabit} onLog={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Read 30 mins')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('shows checkmark when done today', () => {
    render(<HabitCard habit={baseHabit} todayLog="done" onLog={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('shows notes when present', () => {
    render(<HabitCard habit={baseHabit} onLog={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Before bed')).toBeInTheDocument();
  });

  it('menu toggle shows edit/delete buttons', async () => {
    const user = userEvent.setup();
    render(<HabitCard habit={baseHabit} onLog={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '' }));
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onEdit when edit clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<HabitCard habit={baseHabit} onLog={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '' }));
    await user.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(baseHabit);
  });

  it('calls onDelete when delete clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<HabitCard habit={baseHabit} onLog={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: '' }));
    await user.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('habit-1');
  });

  it('calls onLog when log button clicked', async () => {
    const onLog = vi.fn();
    const user = userEvent.setup();
    render(<HabitCard habit={baseHabit} onLog={onLog} onEdit={vi.fn()} onDelete={vi.fn()} />);
    await user.click(screen.getByTitle('Mark as done'));
    expect(onLog).toHaveBeenCalledWith('habit-1', 'done');
  });
});
