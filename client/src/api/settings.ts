import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
<<<<<<< HEAD
import type {
  UserProfile,
  UserPreferences,
  NotificationSettings,
  CategoryDefinition,
  UpdateProfileInput,
  UpdatePreferencesInput,
  UpdateNotificationsInput,
  CreateCategoryInput,
} from '@whatdo/shared';
=======
import type { UserSettings, SettingsUpdate, ThemeMode } from '@whatdo/shared';
>>>>>>> worktree-wf_76154838-1ed-5

const BASE = '/api/settings';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
<<<<<<< HEAD
=======
    credentials: 'include',
>>>>>>> worktree-wf_76154838-1ed-5
    ...options,
  });
  if (!res.ok) throw new Error(`Settings API error: ${res.status}`);
  return res.json();
}

<<<<<<< HEAD
// ── GET hooks ──

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['settings', 'profile'],
    queryFn: () => request(`${BASE}/profile`),
  });
}

export function usePreferences() {
  return useQuery<UserPreferences>({
    queryKey: ['settings', 'preferences'],
    queryFn: () => request(`${BASE}/preferences`),
  });
}

export function useNotifications() {
  return useQuery<NotificationSettings>({
    queryKey: ['settings', 'notifications'],
    queryFn: () => request(`${BASE}/notifications`),
  });
}

export function useCategories(domain?: string) {
  const params = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  return useQuery<CategoryDefinition[]>({
    queryKey: ['settings', 'categories', domain],
    queryFn: () => request(`${BASE}/categories${params}`),
  });
}

// ── Mutation hooks ──

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      request<UserProfile[]>(`${BASE}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'profile'] }),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) =>
      request<UserPreferences[]>(`${BASE}/preferences`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'preferences'] }),
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificationsInput) =>
      request<NotificationSettings[]>(`${BASE}/notifications`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'notifications'] }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      request<CategoryDefinition>(`${BASE}/categories`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<CategoryDefinition[]>(`${BASE}/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'categories'] }),
  });
}

export function useExport() {
  return useMutation({
    mutationFn: () =>
      request<{ exportedAt: string; appVersion: string; data: Record<string, unknown[]> }>(`${BASE}/export`),
  });
}

export function useImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { exportedAt: string; appVersion: string; data: Record<string, unknown[]> }) =>
      request<Record<string, { imported: number; skipped: number }>>(`${BASE}/import`, {
        method: 'POST',
=======
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
>>>>>>> worktree-wf_76154838-1ed-5
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
<<<<<<< HEAD
=======

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
>>>>>>> worktree-wf_76154838-1ed-5
