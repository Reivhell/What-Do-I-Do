import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UserSettings, SettingsUpdate, ThemeMode,
  UserProfile, UserPreferences, NotificationSettings,
  CategoryDefinition, CategoryDomain,
  UpdateProfileInput, UpdatePreferencesInput, UpdateNotificationsInput,
  ExportData, ImportResult,
} from '@whatdo/shared';
import { request } from './client';

const BASE = '/api/settings';

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

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['settings', 'profile'],
    queryFn: () => request<UserProfile>(`${BASE}/profile`),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<UserProfile, Error, UpdateProfileInput>({
    mutationFn: (data) =>
      request<UserProfile>(`${BASE}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'profile'] }),
  });
}

export function usePreferences() {
  return useQuery<UserPreferences>({
    queryKey: ['settings', 'preferences'],
    queryFn: () => request<UserPreferences>(`${BASE}/preferences`),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation<UserPreferences, Error, UpdatePreferencesInput>({
    mutationFn: (data) =>
      request<UserPreferences>(`${BASE}/preferences`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'preferences'] }),
  });
}

export function useNotifications() {
  return useQuery<NotificationSettings>({
    queryKey: ['settings', 'notifications'],
    queryFn: () => request<NotificationSettings>(`${BASE}/notifications`),
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation<NotificationSettings, Error, UpdateNotificationsInput>({
    mutationFn: (data) =>
      request<NotificationSettings>(`${BASE}/notifications`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['settings', 'notifications'] });
    },
  });
}

export function useCategories(domain?: CategoryDomain) {
  return useQuery<CategoryDefinition[]>({
    queryKey: ['settings', 'categories', domain],
    queryFn: () => {
      const params = domain ? `?domain=${domain}` : '';
      return request<CategoryDefinition[]>(`${BASE}/categories${params}`);
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation<CategoryDefinition, Error, { domain: string; name: string; color: string }>({
    mutationFn: (data) =>
      request<CategoryDefinition>(`${BASE}/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      request(`${BASE}/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'categories'] }),
  });
}

export function useExport() {
  return useMutation<ExportData, Error, void>({
    mutationFn: () => request<ExportData>(`${BASE}/export`),
  });
}

export function useImport() {
  const qc = useQueryClient();
  return useMutation<ImportResult, Error, ExportData>({
    mutationFn: (data) =>
      request<ImportResult>(`${BASE}/import`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}