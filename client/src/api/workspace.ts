import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LayoutPreset, WidgetConfigItem } from '@whatdo/shared';
import { request } from './client';

const BASE = '/api/workspace';

// ── Query hooks ──
export function usePresetsList() {
  return useQuery<LayoutPreset[]>({
    queryKey: ['workspace', 'presets'],
    queryFn: () => request(`${BASE}/presets`),
  });
}

export function useActivePreset() {
  return useQuery<LayoutPreset | null>({
    queryKey: ['workspace', 'presets', 'active'],
    queryFn: () => request(`${BASE}/presets/active`),
  });
}

export function useWidgetConfig() {
  return useQuery<WidgetConfigItem[]>({
    queryKey: ['workspace', 'widget-config'],
    queryFn: () => request(`${BASE}/widget-config`),
  });
}

// ── Mutation hooks ──
export function useCreatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; widgetConfig?: WidgetConfigItem[] }) =>
      request<LayoutPreset>(`${BASE}/presets`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}

export function useUpdatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<LayoutPreset>) =>
      request<LayoutPreset | null>(`${BASE}/presets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`${BASE}/presets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}

export function useActivatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<LayoutPreset | null>(`${BASE}/presets/${id}/activate`, {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}

export function useResetDefault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request<LayoutPreset>(`${BASE}/reset-default`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}