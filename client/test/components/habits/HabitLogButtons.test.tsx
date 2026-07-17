import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HabitLogButtons } from '../../../src/components/habits/HabitLogButtons';

describe('HabitLogButtons', () => {
  it('renders log buttons', () => {
    render(<HabitLogButtons habitId="h1" onLog={vi.fn()} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
    expect(screen.getByText('Missed')).toBeInTheDocument();
  });

  it('calls onLog when clicked', async () => {
    const onLog = vi.fn();
    const user = userEvent.setup();
    render(<HabitLogButtons habitId="h1" onLog={onLog} />);
    await user.click(screen.getByTitle('Mark as done'));
    expect(onLog).toHaveBeenCalledWith('done');
  });

  it('disables selected button', () => {
    render(<HabitLogButtons habitId="h1" todayLog="done" onLog={vi.fn()} />);
    expect(screen.getByTitle('Already done')).toBeDisabled();
  });
});
