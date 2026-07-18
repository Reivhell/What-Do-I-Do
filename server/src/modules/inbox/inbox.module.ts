import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller.js'
import { InboxService } from './inbox.service.js'
import { TasksModule } from '../tasks/tasks.module.js'
import { PlannerModule } from '../planner/planner.module.js'
import { HabitsModule } from '../habits/habits.module.js'
import { GoalsModule } from '../goals/goals.module.js'
import { MoneyModule } from '../money/money.module.js'

@Module({
  imports: [TasksModule, PlannerModule, HabitsModule, GoalsModule, MoneyModule],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
