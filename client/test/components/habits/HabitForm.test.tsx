import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HabitForm } from '../../../src/components/habits/HabitForm';

describe('HabitForm', () => {
  it('renders form fields', () => {
    render(<HabitForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g. Morning run')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<HabitForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows Save button when editing', () => {
    render(<HabitForm onSubmit={vi.fn()} onCancel={vi.fn()} isEditing />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
