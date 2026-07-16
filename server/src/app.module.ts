import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './common/database/database.module';
import { LoggerModule } from './common/logger/logger.module';
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
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BackupModule } from './common/backup/backup.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    LoggerModule,
    BackupModule,
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
    WorkspaceModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
