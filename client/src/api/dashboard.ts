import { useQuery } from '@tanstack/react-query';
import type { DashboardSummary } from '@whatdo/shared';

const BASE = '/api/dashboard';

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`);
  return res.json();
}

export function useDashboardSummary(userId: string) {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary', userId],
    queryFn: () => request(`${BASE}/summary?userId=${userId}`),
    refetchInterval: 30_000,
  });
}
