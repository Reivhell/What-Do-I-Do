import { Module } from '@nestjs/common';
import { MoneyController } from './money.controller';
import { MoneyService } from './money.service';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [AchievementsModule],
  controllers: [MoneyController],
  providers: [MoneyService],
  exports: [MoneyService],
})
export class MoneyModule {}
