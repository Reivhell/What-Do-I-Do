import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { TasksModule } from '../tasks/tasks.module';
import { PlannerModule } from '../planner/planner.module';
import { HabitsModule } from '../habits/habits.module';
import { GoalsModule } from '../goals/goals.module';
import { MoneyModule } from '../money/money.module';

@Module({
  imports: [TasksModule, PlannerModule, HabitsModule, GoalsModule, MoneyModule],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
