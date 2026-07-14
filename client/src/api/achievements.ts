import type { AchievementWithProgress } from '../types/achievements';

const BASE = '/api/achievements';

export async function getAchievements(): Promise<AchievementWithProgress[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
}

export async function getUnlocked(): Promise<AchievementWithProgress[]> {
  const res = await fetch(`${BASE}/unlocked`);
  if (!res.ok) throw new Error('Failed to fetch unlocked achievements');
  return res.json();
}

export async function getAchievement(id: string): Promise<AchievementWithProgress> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Achievement not found');
  return res.json();
}
