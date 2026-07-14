import { Module, forwardRef } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { PlannerModule } from '../planner/planner.module';
import { ActivityTrackerModule } from '../activity-tracker/activity-tracker.module';
import { GoalsModule } from '../goals/goals.module';
import { AchievementsModule } from '../achievements/achievements.module';

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