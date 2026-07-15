import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ActivityTrackerModule } from '../activity-tracker/activity-tracker.module';
import { PlannerModule } from '../planner/planner.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { InsightsModule } from '../insights/insights.module';

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
