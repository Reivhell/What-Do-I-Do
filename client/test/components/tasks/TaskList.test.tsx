import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../../../src/components/tasks/TaskList';

vi.mock('../../../src/api/tasks', () => ({
  useTasksList: () => ({ data: [], isLoading: false, error: null }),
  useCreateTask: () => ({ mutate: vi.fn() }),
  useUpdateTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useArchiveTask: () => ({ mutate: vi.fn() }),
  useBulkUpdateTaskStatus: () => ({ mutate: vi.fn() }),
  useScheduleTask: () => ({ mutate: vi.fn() }),
  useCreateSubtask: () => ({ mutate: vi.fn() }),
  useUpdateSubtask: () => ({ mutate: vi.fn() }),
  useDeleteSubtask: () => ({ mutate: vi.fn() }),
}));

describe('TaskList', () => {
  it('renders without crashing', () => {
    render(<TaskList />);
    expect(screen.getByText('No tasks here')).toBeInTheDocument();
  });
});
