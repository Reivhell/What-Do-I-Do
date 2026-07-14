import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';

/**
 * Scheduled job runner for analytics snapshot generation.
 * Uses node-cron inside the NestJS process (no Redis/BullMQ).
 * Per 18-scaling-notes.md §2 & §4: single-user local app, in-process scheduling is sufficient.
 */
@Injectable()
export class AnalyticsScheduler implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsScheduler.name);

  constructor(private readonly snapshotService: SnapshotService) {}

  onModuleInit() {
    // Try to import node-cron — it's optional for local dev
    this.trySchedule();
  }

  private async trySchedule() {
    try {
      const cron = await import('node-cron');

      // Daily snapshot at 01:00
      cron.schedule('0 1 * * *', async () => {
        this.logger.log('Running daily analytics snapshot...');
        try {
          const result = await this.snapshotService.generateAllDailyAndDerived();
          this.logger.log(`Daily snapshot complete: ${result.usersProcessed} user(s) processed`);
        } catch (err) {
          this.logger.error('Daily snapshot failed', err);
        }
      });

      this.logger.log('Analytics scheduler registered (daily at 01:00)');
    } catch {
      this.logger.warn('node-cron not installed — scheduled analytics disabled. Install: npm install node-cron -w server');
    }
  }
}
