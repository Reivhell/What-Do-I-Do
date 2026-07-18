import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js'

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Query('userId') userId: string) {
    return this.dashboardService.getSummary(userId);
  }
}
