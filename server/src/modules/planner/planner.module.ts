import { Module, forwardRef } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { TasksModule } from '../tasks/tasks.module';
import { ActivityTrackerModule } from '../activity-tracker/activity-tracker.module';

@Module({
  imports: [TasksModule, forwardRef(() => ActivityTrackerModule)],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}
