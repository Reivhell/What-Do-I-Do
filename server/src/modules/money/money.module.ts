import { Module } from '@nestjs/common';
import { MoneyController } from './money.controller.js'
import { MoneyService } from './money.service.js'
import { AchievementsModule } from '../achievements/achievements.module.js'

@Module({
  imports: [AchievementsModule],
  controllers: [MoneyController],
  providers: [MoneyService],
  exports: [MoneyService],
})
export class MoneyModule {}
