import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InsightCard } from '../../../src/components/insights/InsightCard';
import type { Insight } from '@whatdo/shared';

const insight: Insight = {
  id: 'i1',
  userId: 'u1',
  type: 'productivity',
  message: 'You completed 80% of tasks this week',
  severity: 'info',
  sourceMetric: null,
  generatedAt: new Date().toISOString(),
  dismissed: false,
};

describe('InsightCard', () => {
  it('renders insight message', () => {
    render(<InsightCard insight={insight} onDismiss={vi.fn()} />);
    expect(screen.getByText('You completed 80% of tasks this week')).toBeInTheDocument();
  });
});
