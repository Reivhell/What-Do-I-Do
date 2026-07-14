// client/src/types/achievements.ts
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  requirementType: string;
  requirementValue: number;
  icon: string;
  category: string;
}

export interface AchievementWithProgress extends AchievementDefinition {
  progress: number;
  unlockedAt: string | null;
  userAchievementId: string | null;
}

export type AchievementCategory = 'activity' | 'habits' | 'goals' | 'planner' | 'money' | 'loyalty';
