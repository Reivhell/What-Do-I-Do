import { Global, Module } from '@nestjs/common';
import { BackupService } from './backup.service.js'
import { BackupScheduler } from './backup.scheduler.js'

@Global()
@Module({
  providers: [BackupService, BackupScheduler],
  exports: [BackupService],
})
export class BackupModule {}
