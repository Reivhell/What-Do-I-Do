// server/src/modules/achievements/seed.ts
import { achievementDefinitions } from '../../drizzle/schema/achievements';
import type { DbInstance } from '../../drizzle';
import { randomUUID } from 'crypto';

export const ACHIEVEMENT_SEEDS = [
  // Activity
  { title: 'First Steps', description: 'Complete your first activity session', requirementType: 'sessions_completed', requirementValue: 1, icon: '🎯', category: 'activity' },
  { title: 'Dedicated', description: 'Log 10 hours of tracked activity', requirementType: 'total_hours_tracked', requirementValue: 10, icon: '⏱️', category: 'activity' },
  { title: 'Century', description: 'Log 100 hours of tracked activity', requirementType: 'total_hours_tracked', requirementValue: 100, icon: '💪', category: 'activity' },
  { title: 'Marathoner', description: 'Complete 50 activity sessions', requirementType: 'sessions_completed', requirementValue: 50, icon: '🏃', category: 'activity' },
  // Habits
  { title: 'Consistency', description: 'Complete your first habit log', requirementType: 'habit_completions', requirementValue: 1, icon: '✅', category: 'habits' },
  { title: 'Week Warrior', description: 'Reach a 7-day streak on any habit', requirementType: 'streak_days', requirementValue: 7, icon: '🔥', category: 'habits' },
  { title: 'Monthly Master', description: 'Reach a 30-day streak on any habit', requirementType: 'streak_days', requirementValue: 30, icon: '💎', category: 'habits' },
  { title: 'Habit Stacker', description: 'Complete 100 habit logs total', requirementType: 'habit_completions', requirementValue: 100, icon: '📊', category: 'habits' },
  // Goals
  { title: 'Achiever', description: 'Complete your first goal', requirementType: 'goal_completed', requirementValue: 1, icon: '🏆', category: 'goals' },
  { title: 'Goal Crusher', description: 'Complete 5 goals', requirementType: 'goal_completed', requirementValue: 5, icon: '🚀', category: 'goals' },
  // Planner
  { title: 'Planner', description: 'Complete your first planner event', requirementType: 'planner_events_completed', requirementValue: 1, icon: '📅', category: 'planner' },
  { title: 'Scheduler', description: 'Complete 50 planner events', requirementType: 'planner_events_completed', requirementValue: 50, icon: '🗓️', category: 'planner' },
  // Money — real check for budget_kept needs consecutive counter
  { title: 'Pennywise', description: 'Stay under budget for one period', requirementType: 'budget_kept', requirementValue: 1, icon: '💰', category: 'money' },
  { title: 'Budget Master', description: 'Stay under budget for 3 periods in a row', requirementType: 'budget_kept', requirementValue: 3, icon: '🤑', category: 'money' },
  // Loyalty
  { title: 'Week One', description: 'Use the app for 7 days', requirementType: 'days_active', requirementValue: 7, icon: '🌟', category: 'loyalty' },
  { title: 'One Month', description: 'Use the app for 30 days', requirementType: 'days_active', requirementValue: 30, icon: '⭐', category: 'loyalty' },
];

export async function seedAchievements(db: DbInstance) {
  const existing = await db.select().from(achievementDefinitions).limit(1);
  if (existing.length > 0) return; // already seeded

  await db.insert(achievementDefinitions).values(
    ACHIEVEMENT_SEEDS.map(a => ({ ...a, id: randomUUID() }))
  );
}
