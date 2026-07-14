import { Module } from '@nestjs/common';
import { InsightService } from './insight.service';
import { InsightController } from './insight.controller';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [InsightService],
  controllers: [InsightController],
  exports: [InsightService],
})
export class InsightsModule {}