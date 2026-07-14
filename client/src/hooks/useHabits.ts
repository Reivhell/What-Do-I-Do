import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, createHabit, updateHabit, deleteHabit, logHabit, fetchHabitLogs, fetchHabitWithLogs } from '../api/habits';
import type { Habit, HabitLog, CreateHabitInput, UpdateHabitInput, LogHabitInput, HabitWithLogs } from '../types/habits';

export function useHabits() {
  return useQuery({ queryKey: ['habits'], queryFn: fetchHabits });
}

export function useHabit(habitId: string) {
  return useQuery({
    queryKey: ['habits', habitId],
    queryFn: () => fetchHabitWithLogs(habitId),
    enabled: !!habitId,
  });
}

export function useHabitLogs(habitId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['habits', habitId, 'logs', from, to],
    queryFn: () => fetchHabitLogs(habitId, from, to),
    enabled: !!habitId,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHabit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitInput }) => updateHabit(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habits', vars.id] });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useLogHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LogHabitInput }) => logHabit(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habits', vars.id] });
      qc.invalidateQueries({ queryKey: ['habits', vars.id, 'logs'] });
    },
  });
}

export function useTodayLogs(habitIds: string[]) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['habits', 'logs', 'today', habitIds.sort().join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        habitIds.map(id => fetchHabitLogs(id, today, today))
      );
      return results.flat();
    },
    enabled: habitIds.length > 0,
  });
}