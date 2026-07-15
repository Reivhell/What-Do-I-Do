import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserSettings, SettingsUpdate, ThemeMode } from '@whatdo/shared';

const BASE = '/api/settings';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`Settings API error: ${res.status}`);
  return res.json();
}

export function useSettings() {
  return useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: () => request<UserSettings>(BASE),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation<UserSettings, Error, SettingsUpdate>({
    mutationFn: (data) =>
      request<UserSettings>(BASE, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useTheme() {
  return useQuery<{ theme: ThemeMode }>({
    queryKey: ['settings', 'theme'],
    queryFn: () => request<{ theme: ThemeMode }>(`${BASE}/theme`),
  });
}

export function useUpdateTheme() {
  const qc = useQueryClient();
  return useMutation<{ theme: ThemeMode }, Error, ThemeMode>({
    mutationFn: (theme) =>
      request<{ theme: ThemeMode }>(`${BASE}/theme`, {
        method: 'PATCH',
        body: JSON.stringify({ theme }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['settings', 'theme'] });
    },
  });
}

export function useResetSettings() {
  const qc = useQueryClient();
  return useMutation<UserSettings, Error, void>({
    mutationFn: () =>
      request<UserSettings>(BASE, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
