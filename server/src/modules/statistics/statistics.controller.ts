import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service.js'

const DEFAULT_USER_ID = 'default';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overall')
  getOverall(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getOverall(DEFAULT_USER_ID, forceRefresh === 'true');
  }

  @Get('time')
  getTime(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getTime(DEFAULT_USER_ID, forceRefresh === 'true');
  }

  @Get('activity')
  getActivity(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getActivity(DEFAULT_USER_ID, forceRefresh === 'true');
  }

  @Get('money')
  getMoney(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getMoney(DEFAULT_USER_ID, forceRefresh === 'true');
  }

  @Get('habit')
  getHabit(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getHabit(DEFAULT_USER_ID, forceRefresh === 'true');
  }

  @Get('goal')
  getGoal(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getGoal(DEFAULT_USER_ID, forceRefresh === 'true');
  }

  @Get('all')
  getAll(@Query('forceRefresh') forceRefresh?: string) {
    return this.statisticsService.getAll(DEFAULT_USER_ID, forceRefresh === 'true');
  }
}
