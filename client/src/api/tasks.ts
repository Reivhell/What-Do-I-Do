import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Task,
  Subtask,
  TaskView,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  ScheduleTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from '@whatdo/shared';
import { request } from './client';

const BASE = '/api/tasks';

// ── Query hooks ──
export function useTasksList(view?: TaskView) {
  const params = view ? `?view=${view}` : '';
  return useQuery<Task[]>({
    queryKey: ['tasks', { view }],
    queryFn: () => request(`${BASE}${params}`),
  });
}

export function useTaskDetail(taskId: string, enabled = true) {
  return useQuery<Task | null>({
    queryKey: ['tasks', taskId],
    queryFn: () => request(`${BASE}/${taskId}`),
    enabled: enabled && !!taskId,
  });
}

// ── Mutation hooks ──
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      request<Task>(BASE, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      request<Task>(`${BASE}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useScheduleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleTaskInput }) =>
      request<{ task: Task; event: unknown }>(`${BASE}/${id}/schedule`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useArchiveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<Task>(`${BASE}/${id}/archive`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useBulkUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskIds, status }: { taskIds: string[]; status: TaskStatus }) =>
      request<Task[]>(`${BASE}/bulk/status`, {
        method: 'PATCH',
        body: JSON.stringify({ taskIds, status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// ── Subtask hooks ──
export function useCreateSubtask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubtaskInput) =>
      request<Subtask>(`${BASE}/${taskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });
}

export function useUpdateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSubtaskInput & { id: string }) =>
      request<Subtask>(`${BASE}/subtasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: string) =>
      request(`${BASE}/subtasks/${subtaskId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}