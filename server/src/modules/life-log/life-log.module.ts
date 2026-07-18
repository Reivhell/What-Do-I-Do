import { Module } from '@nestjs/common';
import { LifeLogController } from './life-log.controller.js'
import { LifeLogService } from './life-log.service.js'

@Module({
  controllers: [LifeLogController],
  providers: [LifeLogService],
  exports: [LifeLogService],
})
export class LifeLogModule {}
