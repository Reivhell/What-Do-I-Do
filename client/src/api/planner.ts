import type { PlannerEvent, CreatePlannerEvent, UpdatePlannerEvent, ViewRange } from '../types/planner';

const BASE = '/api/planner';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Planner API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchEvents(date: string, range: ViewRange = 'daily'): Promise<PlannerEvent[]> {
  const params = new URLSearchParams({ date, range });
  const res = await fetch(`${BASE}?${params}`);
  return handleResponse(res);
}

export async function createEvent(data: CreatePlannerEvent): Promise<PlannerEvent> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateEvent(id: string, data: UpdatePlannerEvent): Promise<PlannerEvent> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteEvent(id: string): Promise<PlannerEvent> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function startEvent(id: string): Promise<{ event: PlannerEvent; session: unknown }> {
  const res = await fetch(`${BASE}/${id}/start`, { method: 'POST' });
  return handleResponse(res);
}

export async function scheduleFromTask(taskId: string, data: {
  date: string; startTime: string; endTime: string; durationMinutes: number;
}): Promise<PlannerEvent> {
  const res = await fetch(`${BASE}/from-task/${taskId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function scheduleFromGoalMilestone(milestoneId: string, data: {
  date: string; startTime: string; endTime: string; durationMinutes: number;
}): Promise<PlannerEvent> {
  const res = await fetch(`${BASE}/from-goal-milestone/${milestoneId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
