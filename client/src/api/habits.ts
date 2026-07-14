import type { Habit, HabitLog, CreateHabitInput, UpdateHabitInput, LogHabitInput, HabitWithLogs } from '../types/habits';

const BASE = '/api/habits';
const DEFAULT_USER = 'default';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Habits API error ${res.status}: ${text}`);
  }
  return res.json();
}

function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE}${endpoint}`, window.location.origin);
  url.searchParams.append('userId', DEFAULT_USER);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  }
  return url.toString();
}

export async function fetchHabits(): Promise<Habit[]> {
  const res = await fetch(buildUrl(''));
  return handleResponse(res);
}

export async function createHabit(data: CreateHabitInput): Promise<Habit> {
  const res = await fetch(buildUrl(''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateHabit(id: string, data: UpdateHabitInput): Promise<Habit> {
  const res = await fetch(buildUrl(`/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteHabit(id: string): Promise<void> {
  const res = await fetch(buildUrl(`/${id}`), { method: 'DELETE' });
  return handleResponse(res);
}

export async function logHabit(id: string, data: LogHabitInput): Promise<HabitLog> {
  const res = await fetch(buildUrl(`/${id}/log`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function fetchHabitLogs(habitId: string, from?: string, to?: string): Promise<HabitLog[]> {
  const res = await fetch(buildUrl(`/${habitId}/logs`, { from: from || '', to: to || '' }));
  return handleResponse(res);
}

export async function fetchHabitWithLogs(habitId: string): Promise<HabitWithLogs | null> {
  const res = await fetch(buildUrl(`/${habitId}`));
  if (res.status === 404) return null;
  return handleResponse(res);
}