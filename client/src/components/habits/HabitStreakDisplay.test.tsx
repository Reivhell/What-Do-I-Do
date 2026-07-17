import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HabitStreakDisplay } from './HabitStreakDisplay';

describe('HabitStreakDisplay', () => {
  it('shows current, best and completion rate', () => {
    render(<HabitStreakDisplay current={5} best={12} completionCount={7} missedCount={3} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument(); // round(7/10*100)
    expect(screen.getByText('7/10')).toBeInTheDocument();
  });

  it('shows 0% rate when there are no logs', () => {
    render(<HabitStreakDisplay current={0} best={0} completionCount={0} missedCount={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
