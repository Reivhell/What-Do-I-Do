import { useQuery } from '@tanstack/react-query';
import type { DashboardSummary } from '@whatdo/shared';
import { request } from './client';

const BASE = '/api/dashboard';

export function useDashboardSummary(userId: string) {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary', userId],
    queryFn: () => request(`${BASE}/summary?userId=${userId}`),
    refetchInterval: 30_000,
  });
}
