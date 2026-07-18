import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventCard } from '../../../src/components/planner/EventCard';
import type { PlannerEvent } from '../../../src/types/planner';

const event: PlannerEvent = {
  id: 'e1',
  userId: 'u1',
  title: 'Team standup',
  date: '2026-07-17',
  startTime: '2026-07-17T09:00:00Z',
  endTime: '2026-07-17T09:15:00Z',
  durationMinutes: 15,
  category: null,
  priority: 'medium',
  notes: null,
  repeatRule: null,
  reminderTime: null,
  sourceType: 'manual',
  sourceId: null,
  status: 'scheduled',
  realizedSessionId: null,
  createdAt: '2026-07-16',
  updatedAt: '2026-07-16',
};

describe('EventCard', () => {
  it('renders event title', () => {
    render(<EventCard event={event} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Team standup')).toBeInTheDocument();
  });
});
