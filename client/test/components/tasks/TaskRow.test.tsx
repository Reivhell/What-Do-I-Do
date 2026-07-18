import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskRow } from '../../../src/components/tasks/TaskRow';
import type { Task } from '../../../src/types/tasks';

vi.mock('../../../src/api/tasks', () => ({
  useUpdateTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useArchiveTask: () => ({ mutate: vi.fn() }),
  useUpdateSubtask: () => ({ mutate: vi.fn() }),
}));

const task: Task = {
  id: 't1',
  userId: 'u1',
  title: 'Buy groceries',
  status: 'active',
  priority: 'high',
  tags: [],
  createdAt: '2026-07-17',
  updatedAt: '2026-07-17',
};

describe('TaskRow', () => {
  it('renders task title', () => {
    render(<TaskRow task={task} onToggleSubtasks={vi.fn()} showSubtasks={false} onTaskClick={vi.fn()} onSchedule={vi.fn()} />);
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });
});
