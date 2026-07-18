import { Module, forwardRef } from '@nestjs/common';
import { TasksController } from './tasks.controller.js'
import { TasksService } from './tasks.service.js'
import { PlannerModule } from '../planner/planner.module.js'

@Module({
  imports: [forwardRef(() => PlannerModule)],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
