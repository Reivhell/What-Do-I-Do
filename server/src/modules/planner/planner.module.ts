import { Module, forwardRef } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { TasksModule } from '../tasks/tasks.module';
import { ActivityTrackerModule } from '../activity-tracker/activity-tracker.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [forwardRef(() => TasksModule), forwardRef(() => ActivityTrackerModule), AchievementsModule],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}
