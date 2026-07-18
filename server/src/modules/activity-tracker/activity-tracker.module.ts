import { Module, forwardRef } from '@nestjs/common';
import { ActivityTrackerController } from './activity-tracker.controller.js'
import { ActivityTrackerService } from './activity-tracker.service.js'
import { PlannerModule } from '../planner/planner.module.js'
import { AchievementsModule } from '../achievements/achievements.module.js'

@Module({
  imports: [forwardRef(() => PlannerModule), AchievementsModule],
  controllers: [ActivityTrackerController],
  providers: [ActivityTrackerService],
  exports: [ActivityTrackerService],
})
export class ActivityTrackerModule {}
