import { Module } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementsEventGateway } from './achievements.gateway';

@Module({
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementsEventGateway],
  exports: [AchievementsEventGateway],
})
export class AchievementsModule {}
