import { describe, it, expect } from 'vitest';
import type { CreateCaptureInput, CaptureItem, CaptureStatus } from '../../src/types/inbox';

describe('Inbox types', () => {
  it('should create CreateCaptureInput', () => {
    const input: CreateCaptureInput = {
      content: 'Buy groceries',
      source: 'manual',
    };
    expect(input.content).toBe('Buy groceries');
  });

  it('should create CaptureItem with all fields', () => {
    const item: CaptureItem = {
      id: '1', userId: 'u1', content: 'Task',
      source: 'voice', status: 'pending',
      aiContext: null, convertedTo: null,
      createdAt: '', updatedAt: '',
    };
    expect(item.status).toBe('pending');
  });

  it('should accept all capture statuses', () => {
    const statuses: CaptureStatus[] = ['pending', 'converted', 'archived'];
    expect(statuses).toHaveLength(3);
  });
});
