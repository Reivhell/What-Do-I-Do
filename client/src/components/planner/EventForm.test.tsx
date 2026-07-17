import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventForm } from './EventForm';

describe('EventForm (Planner scheduling)', () => {
  it('builds ISO start/end and duration from date + time inputs', () => {
    const onSave = vi.fn();
    render(<EventForm event={null} onSave={onSave} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Standup' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2026-07-15' } });
    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText(/End/i), { target: { value: '10:30' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Event/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const data = onSave.mock.calls[0][0];
    expect(data.startTime).toBe('2026-07-15T09:00:00.000Z');
    expect(data.endTime).toBe('2026-07-15T10:30:00.000Z');
    expect(data.durationMinutes).toBe(90);
  });

  it('computes reminder time from offset minutes before start', () => {
    const onSave = vi.fn();
    render(<EventForm event={null} onSave={onSave} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Call' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2026-07-15' } });
    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/End/i), { target: { value: '11:00' } });
    fireEvent.change(screen.getByDisplayValue('No reminder'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Event/i }));

    const data = onSave.mock.calls[0][0];
    // 60 min before 10:00 => 09:00
    expect(new Date(data.reminderTime).getUTCHours()).toBe(9);
  });
});
