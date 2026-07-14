import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Habit,
  HabitLog,
  HabitLogStatus,
  CreateHabitInput,
  UpdateHabitInput,
  LogHabitInput,
  HabitWithLogs,
} from '@whatdo/shared';

const BASE = '/api/habits';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Habits API error: ${res.status}`);
  return res.json();
}

export function useHabitsList() {
  return useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () => request<Habit[]>(BASE),
  });
}

export function useHabit(habitId: string) {
  return useQuery<HabitWithLogs>({
    queryKey: ['habits', habitId],
    queryFn: () => request<HabitWithLogs>(`${BASE}/${habitId}/with-logs`),
    enabled: !!habitId,
  });
}

export function useHabitLogs(habitId: string, from?: string, to?: string) {
  return useQuery<HabitLog[]>({
    queryKey: ['habits', habitId, 'logs', from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      return request<HabitLog[]>(`${BASE}/${habitId}/logs${qs ? `?${qs}` : ''}`);
    },
    enabled: !!habitId,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHabitInput) =>
      request<Habit>(BASE, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitInput }) =>
      request<Habit>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habits', vars.id] });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useLogHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LogHabitInput }) =>
      request<HabitLog>(`${BASE}/${id}/log`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useTodayLogs(habitIds: string[]) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery<{ habitId: string; status: HabitLogStatus }[]>({
    queryKey: ['habits', 'today', ...habitIds],
    queryFn: async () => {
      const entries = await Promise.all(
        habitIds.map(async (hid) => {
          const log = await request<HabitLog[]>(`${BASE}/${hid}/logs?from=${today}&to=${today}`);
          return log.length > 0 ? { habitId: hid, status: log[0].status } : null;
        }),
      );
      return entries.filter(Boolean) as { habitId: string; status: HabitLogStatus }[];
    },
    enabled: habitIds.length > 0,
  });
}
