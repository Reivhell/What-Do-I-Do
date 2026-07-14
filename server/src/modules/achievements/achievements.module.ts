import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementsEventGateway } from './achievements.gateway';
import { DRIZZLE } from '../../common/database/drizzle.provider';
import type { DbInstance } from '../../drizzle';
import { seedAchievements } from './seed';

@Module({
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementsEventGateway],
  exports: [AchievementsEventGateway],
})
export class AchievementsModule implements OnModuleInit {
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}

  async onModuleInit() {
    await seedAchievements(this.db);
  }
}
