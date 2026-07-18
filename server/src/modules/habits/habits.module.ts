import { Module, forwardRef } from '@nestjs/common';
import { HabitsController } from './habits.controller.js'
import { HabitsService } from './habits.service.js'
import { PlannerModule } from '../planner/planner.module.js'
import { ActivityTrackerModule } from '../activity-tracker/activity-tracker.module.js'
import { GoalsModule } from '../goals/goals.module.js'
import { AchievementsModule } from '../achievements/achievements.module.js'

@Module({
  imports: [
    forwardRef(() => PlannerModule),
    forwardRef(() => ActivityTrackerModule),
    forwardRef(() => GoalsModule),
    AchievementsModule,
  ],
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService],
})
export class HabitsModule {}