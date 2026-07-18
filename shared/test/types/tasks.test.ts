import { describe, it, expect } from 'vitest';
import type { Task, TaskStatus, TaskPriority } from '../../src/types/tasks';

describe('Task types', () => {
  const task: Task = {
    id: '1', userId: 'u1', title: 'Write tests',
    description: null, status: 'pending', priority: 'medium',
    dueDate: null, tags: [],
    createdAt: '', updatedAt: '',
  };

  it('should create valid Task', () => {
    expect(task.title).toBe('Write tests');
    expect(task.status).toBe('pending');
  });

  it('should accept all statuses', () => {
    const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    expect(statuses).toContain(task.status);
  });

  it('should accept all priorities', () => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    expect(priorities).toContain(task.priority);
  });
});
