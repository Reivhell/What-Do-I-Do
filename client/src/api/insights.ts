import { useQuery, useMutation } from '@tanstack/react-query';
import { Insight, InsightType, WeeklySummary } from '@whatdo/shared';
import { request } from './client';

const BASE = '/api/insights';

export const insightsApi = {
  getInsights: (type?: InsightType, active = true, limit = 5) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('active', String(active));
    params.set('limit', String(limit));
    return request<Insight[]>(`${BASE}?${params.toString()}`);
  },

  dismissInsight: (id: string) =>
    request(`${BASE}/${id}/dismiss`, { method: 'POST' }),

  getWeeklySummary: () =>
    request<WeeklySummary>(`${BASE}/weekly-summary`),
};

export function useInsights(type?: InsightType, active = true, limit = 5) {
  return useQuery({
    queryKey: ['insights', type, active, limit],
    queryFn: () => insightsApi.getInsights(type, active, limit),
  });
}

export function useDismissInsight() {
  return useMutation({
    mutationFn: (id: string) => insightsApi.dismissInsight(id),
  });
}

export function useWeeklySummary() {
  return useQuery({
    queryKey: ['insights', 'weekly-summary'],
    queryFn: () => insightsApi.getWeeklySummary(),
  });
}