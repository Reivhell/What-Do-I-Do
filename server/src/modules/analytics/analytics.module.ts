import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SnapshotService } from './snapshot.service';
import { ScoreCalculator } from './score-calculator';
import { AnalyticsScheduler } from './scheduler.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    SnapshotService,
    ScoreCalculator,
    AnalyticsScheduler,
  ],
  exports: [SnapshotService],
})
export class AnalyticsModule {}
