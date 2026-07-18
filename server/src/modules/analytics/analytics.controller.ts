import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService, ReviewQuery, RangeQuery, TrendQuery } from './analytics.service.js'
import { SnapshotService } from './snapshot.service.js'

const DEFAULT_USER_ID = 'default';

@Controller()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly snapshotService: SnapshotService,
  ) {}

  // ── Analytics (served under /analytics/*) ──

  @Get('analytics/review')
  async getReview(
    @Query('period') period: ReviewQuery['period'],
    @Query('date') date: string,
    @Query('userId') userId?: string,
  ) {
    return this.analyticsService.getReview(userId || DEFAULT_USER_ID, { period, date });
  }

  @Get('analytics/planned-vs-actual')
  async getPlannedVsActual(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('userId') userId?: string,
  ) {
    return this.analyticsService.getPlannedVsActual(userId || DEFAULT_USER_ID, { start, end });
  }

  @Get('analytics/time-distribution')
  async getTimeDistribution(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('userId') userId?: string,
  ) {
    return this.analyticsService.getTimeDistribution(userId || DEFAULT_USER_ID, { start, end });
  }

  @Get('analytics/trend')
  async getTrend(
    @Query('metric') metric: TrendQuery['metric'],
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('userId') userId?: string,
  ) {
    return this.analyticsService.getTrend(userId || DEFAULT_USER_ID, { metric, range: { start, end } });
  }

  @Get('analytics/export')
  async exportData(
    @Query('format') format: string,
    @Query('userId') userId?: string,
  ) {
    const data = await this.analyticsService.getExportData(userId || DEFAULT_USER_ID);
    if (format === 'csv') {
      return this.toCsv(data);
    }
    return data;
  }

  // ── Manual trigger (for testing) ──

  @Get('analytics/generate-daily')
  async triggerDaily(@Query('userId') userId?: string) {
    await this.snapshotService.generateDailySnapshot(userId || DEFAULT_USER_ID);
    return { ok: true };
  }

  // ── Helpers ──

  private toCsv(data: Record<string, unknown>): string {
    const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const k = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flatten(value as Record<string, unknown>, k));
        } else {
          result[k] = value;
        }
      }
      return result;
    };

    const flat = flatten(data);
    const headers = Object.keys(flat);
    const values = headers.map((h) => String(flat[h] ?? ''));
    return `${headers.join(',')}\n${values.join(',')}`;
  }
}
