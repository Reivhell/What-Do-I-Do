import { describe, it, expect } from 'vitest';
import type { Insight, InsightSeverity } from '../../src/types/insights';

describe('Insight types', () => {
  const insight: Insight = {
    id: '1', userId: 'u1',
    type: 'streak', severity: 'positive',
    title: 'Great streak!', message: '5 day streak',
    dismissed: false,
    createdAt: '',
  };

  it('should create valid Insight', () => {
    expect(insight.title).toBe('Great streak!');
  });

  it('should accept all severities', () => {
    const severities: InsightSeverity[] = ['positive', 'info', 'warning', 'critical'];
    expect(severities).toContain(insight.severity);
  });
});
