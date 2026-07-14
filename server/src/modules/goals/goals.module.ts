import { Module, forwardRef } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { PlannerModule } from '../planner/planner.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [forwardRef(() => PlannerModule), AchievementsModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
