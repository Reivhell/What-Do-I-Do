import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CaptureItem,
  CaptureStatus,
  CreateCaptureInput,
  UpdateCaptureInput,
  ConvertCaptureInput,
} from '@whatdo/shared';
import { request } from './client';

const BASE = '/api/inbox';

export function useInboxList(status?: CaptureStatus, q?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  const qs = params.toString();
  return useQuery<CaptureItem[]>({
    queryKey: ['inbox', { status, q }],
    queryFn: () => request(`${BASE}${qs ? `?${qs}` : ''}`),
  });
}

export function useCreateCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCaptureInput) =>
      request<CaptureItem>(BASE, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useUpdateCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCaptureInput & { id: string }) =>
      request<CaptureItem>(`${BASE}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useArchiveCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<CaptureItem>(`${BASE}/${id}/archive`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useConvertCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetType }: { id: string } & ConvertCaptureInput) =>
      request<CaptureItem>(`${BASE}/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify({ targetType }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useDeleteCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<CaptureItem>(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}