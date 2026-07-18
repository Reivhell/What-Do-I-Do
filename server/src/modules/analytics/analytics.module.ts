import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.js'
import { AnalyticsService } from './analytics.service.js'
import { SnapshotService } from './snapshot.service.js'
import { ScoreCalculator } from './score-calculator.js'
import { AnalyticsScheduler } from './scheduler.service.js'
import { InsightsModule } from '../insights/insights.module.js'

@Module({
  imports: [forwardRef(() => InsightsModule)],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    SnapshotService,
    ScoreCalculator,
    AnalyticsScheduler,
  ],
  exports: [SnapshotService, AnalyticsService],
})
export class AnalyticsModule {}
