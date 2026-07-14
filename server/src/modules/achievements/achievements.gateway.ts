import { Injectable } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Injectable()
export class AchievementsEventGateway {
  constructor(private achievementsService: AchievementsService) {}

  async onSessionCompleted(userId: string, totalSessions: number, totalHours: number) {
    const unlocked = await this.achievementsService.evaluate(userId, 'sessions_completed', totalSessions);
    const unlocked2 = await this.achievementsService.evaluate(userId, 'total_hours_tracked', totalHours);
    return [...unlocked, ...unlocked2];
  }

  async onStreakUpdated(userId: string, streakDays: number, totalCompletions: number) {
    const unlocked = await this.achievementsService.evaluate(userId, 'streak_days', streakDays);
    const unlocked2 = await this.achievementsService.evaluate(userId, 'habit_completions', totalCompletions);
    return [...unlocked, ...unlocked2];
  }

  async onGoalCompleted(userId: string, totalGoalsCompleted: number) {
    return this.achievementsService.evaluate(userId, 'goal_completed', totalGoalsCompleted);
  }

  async onPlannerEventCompleted(userId: string, totalCompleted: number) {
    return this.achievementsService.evaluate(userId, 'planner_events_completed', totalCompleted);
  }

  async onBudgetKept(userId: string, consecutiveKept: number) {
    return this.achievementsService.evaluate(userId, 'budget_kept', consecutiveKept);
  }
}
