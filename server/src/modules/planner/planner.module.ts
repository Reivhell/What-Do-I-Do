import { Module, forwardRef } from '@nestjs/common';
import { PlannerController } from './planner.controller.js'
import { PlannerService } from './planner.service.js'
import { TasksModule } from '../tasks/tasks.module.js'
import { ActivityTrackerModule } from '../activity-tracker/activity-tracker.module.js'
import { AchievementsModule } from '../achievements/achievements.module.js'

@Module({
  imports: [forwardRef(() => TasksModule), forwardRef(() => ActivityTrackerModule), AchievementsModule],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}
