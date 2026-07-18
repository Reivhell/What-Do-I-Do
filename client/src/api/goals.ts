import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Goal,
  Milestone,
  CreateGoalInput,
  UpdateGoalInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  ScheduleMilestoneInput,
  LinkedItem,
} from '@whatdo/shared';
import { request } from './client';

const BASE = '/api/goals';

export interface GoalWithMilestones extends Goal {
  milestones: Milestone[];
}

export function useGoalsList() {
  return useQuery<GoalWithMilestones[]>({
    queryKey: ['goals'],
    queryFn: () => request(`${BASE}`),
  });
}

export function useGoal(goalId: string) {
  return useQuery<Goal>({
    queryKey: ['goals', goalId],
    queryFn: () => request(`${BASE}/${goalId}`),
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) =>
      request<Goal>(BASE, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateGoalInput & { id: string }) =>
      request<Goal>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Goal>(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, ...input }: CreateMilestoneInput & { goalId: string }) =>
      request<Milestone>(`${BASE}/${goalId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, milestoneId, ...input }: UpdateMilestoneInput & { goalId: string; milestoneId: string }) =>
      request<Milestone>(`${BASE}/${goalId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      request<Milestone>(`${BASE}/${goalId}/milestones/${milestoneId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
}

export function useScheduleMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, milestoneId, ...input }: ScheduleMilestoneInput & { goalId: string; milestoneId: string }) =>
      request(`${BASE}/${goalId}/milestones/${milestoneId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useLinkedItems(goalId: string) {
  return useQuery<LinkedItem[]>({
    queryKey: ['goals', goalId, 'linked-items'],
    queryFn: () => request(`${BASE}/${goalId}/linked-items`),
    enabled: !!goalId,
  });
}