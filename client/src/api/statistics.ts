import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  OverviewStats,
  TimeStats,
  ActivityStats,
  MoneyStats,
  HabitStats,
  GoalStats,
} from '@whatdo/shared';

const BASE = '/api/statistics';

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Statistics API error: ${res.status}`);
  return res.json();
}

function buildUrl(path: string, forceRefresh?: boolean): string {
  return `${BASE}${path}${forceRefresh ? '?forceRefresh=true' : ''}`;
}

export function useOverallStats(forceRefresh?: boolean) {
  return useQuery<OverviewStats>({
    queryKey: ['statistics', 'overall', { forceRefresh }],
    queryFn: () => request(buildUrl('/overall', forceRefresh)),
  });
}

export function useTimeStats(forceRefresh?: boolean) {
  return useQuery<TimeStats>({
    queryKey: ['statistics', 'time', { forceRefresh }],
    queryFn: () => request(buildUrl('/time', forceRefresh)),
  });
}

export function useActivityStats(forceRefresh?: boolean) {
  return useQuery<ActivityStats>({
    queryKey: ['statistics', 'activity', { forceRefresh }],
    queryFn: () => request(buildUrl('/activity', forceRefresh)),
  });
}

export function useMoneyStats(forceRefresh?: boolean) {
  return useQuery<MoneyStats>({
    queryKey: ['statistics', 'money', { forceRefresh }],
    queryFn: () => request(buildUrl('/money', forceRefresh)),
  });
}

export function useHabitStats(forceRefresh?: boolean) {
  return useQuery<HabitStats>({
    queryKey: ['statistics', 'habit', { forceRefresh }],
    queryFn: () => request(buildUrl('/habit', forceRefresh)),
  });
}

export function useGoalStats(forceRefresh?: boolean) {
  return useQuery<GoalStats>({
    queryKey: ['statistics', 'goal', { forceRefresh }],
    queryFn: () => request(buildUrl('/goal', forceRefresh)),
  });
}

interface AllStats {
  overall: OverviewStats;
  time: TimeStats;
  activity: ActivityStats;
  money: MoneyStats;
  habit: HabitStats;
  goal: GoalStats;
}

export function useAllStats(forceRefresh?: boolean) {
  return useQuery<AllStats>({
    queryKey: ['statistics', 'all', { forceRefresh }],
    queryFn: () => request(buildUrl('/all', forceRefresh)),
    staleTime: 1000 * 60 * 5, // 5 min client-side stale time
  });
}

export function useInvalidateAllStats() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['statistics'] });
}
