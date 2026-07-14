import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { SettingsModule } from './modules/settings/settings.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PlannerModule } from './modules/planner/planner.module';
import { ActivityTrackerModule } from './modules/activity-tracker/activity-tracker.module';
import { GoalsModule } from './modules/goals/goals.module';
import { HabitsModule } from './modules/habits/habits.module';
import { MoneyModule } from './modules/money/money.module';
import { LifeLogModule } from './modules/life-log/life-log.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { InsightsModule } from './modules/insights/insights.module';
import { AchievementsModule } from './modules/achievements/achievements.module';

@Module({
  imports: [
    DatabaseModule,
    SettingsModule,
    InboxModule,
    TasksModule,
    PlannerModule,
    ActivityTrackerModule,
    GoalsModule,
    HabitsModule,
    MoneyModule,
    LifeLogModule,
    AnalyticsModule,
    StatisticsModule,
    InsightsModule,
    AchievementsModule,
  ],
})
export class AppModule {}
