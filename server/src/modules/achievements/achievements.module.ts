import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { AchievementsController } from './achievements.controller.js'
import { AchievementsService } from './achievements.service.js'
import { AchievementsEventGateway } from './achievements.gateway.js'
import { DRIZZLE } from '../../common/database/drizzle.provider.js'
import type { DbInstance } from '../../drizzle/index.js'
import { seedAchievements } from './seed.js'

@Module({
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementsEventGateway],
  exports: [AchievementsEventGateway, AchievementsService],
})
export class AchievementsModule implements OnModuleInit {
  constructor(@Inject(DRIZZLE) private db: DbInstance) {}

  async onModuleInit() {
    await seedAchievements(this.db);
  }
}
