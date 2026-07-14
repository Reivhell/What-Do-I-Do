import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TimelineItem,
  DailySummary,
  LifeLogAnnotation,
  CreateAnnotationInput,
  UpdateAnnotationInput,
} from '@whatdo/shared';

const BASE = '/api/life-log';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Timeline ──

export function useTimeline(date?: string, sources?: string[], search?: string) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (sources && sources.length > 0) params.set('sources', sources.join(','));
  if (search) params.set('search', search);
  const qs = params.toString() ? `?${params.toString()}` : '';

  return useQuery<TimelineItem[]>({
    queryKey: ['life-log', 'timeline', date, sources, search],
    queryFn: () => request(`${BASE}/timeline${qs}`),
  });
}

export function useDailySummary(date?: string) {
  const params = date ? `?date=${date}` : '';
  return useQuery<DailySummary>({
    queryKey: ['life-log', 'daily-summary', date],
    queryFn: () => request(`${BASE}/daily-summary${params}`),
  });
}

// ── Annotations ──

export function useAnnotations(date?: string) {
  const params = date ? `?date=${date}` : '';
  return useQuery<LifeLogAnnotation[]>({
    queryKey: ['life-log', 'annotations', date],
    queryFn: () => request(`${BASE}/annotations${params}`),
  });
}

export function useCreateAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnotationInput) =>
      request<LifeLogAnnotation>(`${BASE}/annotations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-log'] }),
  });
}

export function useUpdateAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnotationInput }) =>
      request<LifeLogAnnotation>(`${BASE}/annotations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-log'] }),
  });
}

export function useDeleteAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${BASE}/annotations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['life-log'] }),
  });
}
