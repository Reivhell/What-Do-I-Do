import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BackupService } from './backup.service';

/**
 * Daily automated DB snapshot. Mirrors AnalyticsScheduler: in-process node-cron,
 * single-user local app, no Redis/BullMQ needed.
 */
@Injectable()
export class BackupScheduler implements OnModuleInit {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(private readonly backup: BackupService) {}

  onModuleInit() {
    this.trySchedule();
  }

  private async trySchedule() {
    try {
      const cron = await import('node-cron');
      // Daily at 02:00
      cron.schedule('0 2 * * *', () => {
        try {
          const dest = this.backup.backup('auto');
          if (dest) this.logger.log(`Daily backup: ${dest}`);
          this.backup.pruneRetention();
        } catch (err) {
          this.logger.error('Daily backup failed', err);
        }
      });
      const { retentionDays, backupDir } = this.backup.getConfig();
      this.logger.log(`Backup scheduler registered (daily at 02:00, retention: ${retentionDays}d, dir: ${backupDir})`);
    } catch {
      this.logger.warn('node-cron not installed — scheduled backups disabled. Install: npm install node-cron -w server');
    }
  }
}
