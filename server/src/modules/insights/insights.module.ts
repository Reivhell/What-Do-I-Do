import { Module } from '@nestjs/common';
import { InsightService } from './insight.service.js'
import { InsightController } from './insight.controller.js'
import { DatabaseModule } from '../../common/database/database.module.js'

@Module({
  imports: [DatabaseModule],
  providers: [InsightService],
  controllers: [InsightController],
  exports: [InsightService],
})
export class InsightsModule {}