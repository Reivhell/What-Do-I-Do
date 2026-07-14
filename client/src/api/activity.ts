import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ActivitySession,
  StartActivityInput,
  ManualLogInput,
  UpdateActivityInput,
  ActivityHistoryFilter,
} from '@whatdo/shared';

const BASE = '/api/activity';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Activity API error: ${res.status}`);
  return res.json();
}

function buildHistoryParams(filters?: ActivityHistoryFilter): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useActiveSession() {
  return useQuery<ActivitySession | null>({
    queryKey: ['activity', 'active'],
    queryFn: () => request(`${BASE}/active`),
    refetchInterval: 30_000, // poll every 30s for timer accuracy
  });
}

export function useActivityHistory(filters?: ActivityHistoryFilter) {
  return useQuery<ActivitySession[]>({
    queryKey: ['activity', 'history', filters],
    queryFn: () => request(`${BASE}/history${buildHistoryParams(filters)}`),
  });
}

export function useStartActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartActivityInput) =>
      request<ActivitySession>(`${BASE}/start`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity', 'active'] });
      qc.invalidateQueries({ queryKey: ['activity', 'history'] });
    },
  });
}

export function useStopActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<ActivitySession>(`${BASE}/stop/${id}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity', 'active'] });
      qc.invalidateQueries({ queryKey: ['activity', 'history'] });
    },
  });
}

export function useManualLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ManualLogInput) =>
      request<ActivitySession>(`${BASE}/manual-log`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity', 'history'] }),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateActivityInput & { id: string }) =>
      request<ActivitySession>(`${BASE}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity', 'active'] });
      qc.invalidateQueries({ queryKey: ['activity', 'history'] });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<ActivitySession>(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity', 'history'] }),
  });
}
