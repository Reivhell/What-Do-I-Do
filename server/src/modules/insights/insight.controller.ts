import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { InsightService, InsightType } from './insight.service.js'

const DEFAULT_USER_ID = 'default';

@Controller()
export class InsightController {
  constructor(private readonly insightService: InsightService) {}

  @Get('insights')
  async getInsights(
    @Query('type') type?: InsightType,
    @Query('active') active?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    const uid = userId || DEFAULT_USER_ID;
    if (active === 'true') {
      return this.insightService.getActive(uid, type, parseInt(limit ?? '5', 10));
    }
    // If not active-only, return all (for admin/debug)
    // Not needed per spec, but kept for completeness
    return this.insightService.getActive(uid, type, parseInt(limit ?? '20', 10));
  }

  @Post('insights/:id/dismiss')
  async dismissInsight(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    await this.insightService.dismiss(id, userId || DEFAULT_USER_ID);
    return { ok: true };
  }

  @Get('insights/weekly-summary')
  async getWeeklySummary(@Query('userId') userId?: string) {
    return this.insightService.getWeeklySummary(userId || DEFAULT_USER_ID);
  }
}