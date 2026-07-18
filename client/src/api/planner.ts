import type { PlannerEvent, CreatePlannerEvent, UpdatePlannerEvent, ViewRange } from '../types/planner';
import { request } from './client';

const BASE = '/api/planner';

export async function fetchEvents(date: string, range: ViewRange = 'daily'): Promise<PlannerEvent[]> {
  const params = new URLSearchParams({ date, range });
  return request(`${BASE}?${params}`);
}

export async function createEvent(data: CreatePlannerEvent): Promise<PlannerEvent> {
  return request(BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id: string, data: UpdatePlannerEvent): Promise<PlannerEvent> {
  return request(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  return request(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function startEvent(id: string): Promise<{ event: PlannerEvent; session: unknown }> {
  return request(`${BASE}/${id}/start`, { method: 'POST' });
}

export async function scheduleFromTask(taskId: string, data: {
  date: string; startTime: string; endTime: string; durationMinutes: number;
}): Promise<PlannerEvent> {
  return request(`${BASE}/from-task/${taskId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function completeEvent(id: string): Promise<PlannerEvent> {
  return request(`${BASE}/${id}/complete`, { method: 'POST' });
}

export async function getEvent(id: string): Promise<PlannerEvent> {
  return request(`${BASE}/${id}`);
}