import { Module, forwardRef } from '@nestjs/common';
import { ActivityTrackerController } from './activity-tracker.controller';
import { ActivityTrackerService } from './activity-tracker.service';
import { PlannerModule } from '../planner/planner.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [forwardRef(() => PlannerModule), AchievementsModule],
  controllers: [ActivityTrackerController],
  providers: [ActivityTrackerService],
  exports: [ActivityTrackerService],
})
export class ActivityTrackerModule {}
