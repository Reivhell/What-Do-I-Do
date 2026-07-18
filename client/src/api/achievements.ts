import type { AchievementWithProgress } from '../types/achievements';
import { request } from './client';

const BASE = '/api/achievements';

export async function getAchievements(): Promise<AchievementWithProgress[]> {
  return request<AchievementWithProgress[]>(BASE);
}

export async function getUnlocked(): Promise<AchievementWithProgress[]> {
  return request<AchievementWithProgress[]>(`${BASE}/unlocked`);
}

export async function getAchievement(id: string): Promise<AchievementWithProgress> {
  return request<AchievementWithProgress>(`${BASE}/${id}`);
}
