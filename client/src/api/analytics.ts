import { useQuery } from '@tanstack/react-query';

const BASE = '/api/analytics';

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Analytics API error: ${res.status}`);
  return res.json();
}

export interface AnalyticsSummary {
  scores: {
    discipline: number | null;
    focus: number | null;
    consistency: number | null;
  };
  timeDistribution: {
    categories: { category: string; minutes: number }[];
    totalMinutes: number;
  } | null;
  overallStats: any;
  generatedAt: string;
}

export interface PlannedVsActual {
  planned: number;
  actual: number;
  completionRate: number;
}

export interface TrendPoint {
  periodStart: string;
  periodType: string;
  value: number | null;
}

export function useAnalyticsSummary(date?: string) {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics', 'summary', date],
    queryFn: () => request(`${BASE}/review?period=daily&date=${date ?? new Date().toISOString().split('T')[0]}`),
  });
}

export function usePlannedVsActual(start: string, end: string) {
  return useQuery<PlannedVsActual>({
    queryKey: ['analytics', 'planned-vs-actual', start, end],
    queryFn: () => request(`${BASE}/planned-vs-actual?start=${start}&end=${end}`),
  });
}

export function useTimeDistribution(start: string, end: string) {
  return useQuery<AnalyticsSummary['timeDistribution']>({
    queryKey: ['analytics', 'time-distribution', start, end],
    queryFn: () => request(`${BASE}/time-distribution?start=${start}&end=${end}`),
  });
}

export function useTrend(metric: string, start: string, end: string) {
  return useQuery<TrendPoint[]>({
    queryKey: ['analytics', 'trend', metric, start, end],
    queryFn: () => request(`${BASE}/trend?metric=${metric}&start=${start}&end=${end}`),
  });
}
