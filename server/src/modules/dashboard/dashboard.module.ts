import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js'
import { DashboardService } from './dashboard.service.js'
import { ActivityTrackerModule } from '../activity-tracker/activity-tracker.module.js'
import { PlannerModule } from '../planner/planner.module.js'
import { AnalyticsModule } from '../analytics/analytics.module.js'
import { InsightsModule } from '../insights/insights.module.js'

@Module({
  imports: [
    ActivityTrackerModule,
    PlannerModule,
    AnalyticsModule,
    InsightsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
