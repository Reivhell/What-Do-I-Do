import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SnapshotService } from './snapshot.service';
import { ScoreCalculator } from './score-calculator';
import { AnalyticsScheduler } from './scheduler.service';
import { InsightsModule } from '../insights/insights.module';

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
