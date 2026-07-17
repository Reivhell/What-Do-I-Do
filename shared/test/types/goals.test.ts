import { describe, it, expect } from 'vitest';
import type { Goal, Milestone, CreateGoalInput } from '../../src/types/goals';

describe('Goal types', () => {
  const goal: Goal = {
    id: '1', userId: 'u1', title: 'Learn TypeScript',
    description: 'Become proficient', category: 'learning',
    targetDate: null, status: 'active',
    progress: 0, milestones: [],
    createdAt: '', updatedAt: '',
  };

  it('should create valid Goal', () => {
    expect(goal.title).toBe('Learn TypeScript');
    expect(goal.status).toBe('active');
  });

  it('should create Milestone', () => {
    const ms: Milestone = { id: 'm1', goalId: '1', title: 'Finish basics', completed: false };
    expect(ms.completed).toBe(false);
  });

  it('should create CreateGoalInput', () => {
    const input: CreateGoalInput = { title: 'New Goal', category: 'health' };
    expect(input.description).toBeUndefined();
  });
});
