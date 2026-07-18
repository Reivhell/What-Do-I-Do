import { Module, forwardRef } from '@nestjs/common';
import { GoalsController } from './goals.controller.js'
import { GoalsService } from './goals.service.js'
import { PlannerModule } from '../planner/planner.module.js'
import { AchievementsModule } from '../achievements/achievements.module.js'

@Module({
  imports: [forwardRef(() => PlannerModule), AchievementsModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
