import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './common/database/database.module.js'
import { LoggerModule } from './common/logger/logger.module.js'
import { SettingsModule } from './modules/settings/settings.module.js'
import { InboxModule } from './modules/inbox/inbox.module.js'
import { TasksModule } from './modules/tasks/tasks.module.js'
import { PlannerModule } from './modules/planner/planner.module.js'
import { ActivityTrackerModule } from './modules/activity-tracker/activity-tracker.module.js'
import { GoalsModule } from './modules/goals/goals.module.js'
import { HabitsModule } from './modules/habits/habits.module.js'
import { MoneyModule } from './modules/money/money.module.js'
import { LifeLogModule } from './modules/life-log/life-log.module.js'
import { AnalyticsModule } from './modules/analytics/analytics.module.js'
import { StatisticsModule } from './modules/statistics/statistics.module.js'
import { InsightsModule } from './modules/insights/insights.module.js'
import { AchievementsModule } from './modules/achievements/achievements.module.js'
import { WorkspaceModule } from './modules/workspace/workspace.module.js'
import { DashboardModule } from './modules/dashboard/dashboard.module.js'
import { BackupModule } from './common/backup/backup.module.js'

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
