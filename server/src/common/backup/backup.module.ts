import { Global, Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupScheduler } from './backup.scheduler';

@Global()
@Module({
  providers: [BackupService, BackupScheduler],
  exports: [BackupService],
})
export class BackupModule {}
