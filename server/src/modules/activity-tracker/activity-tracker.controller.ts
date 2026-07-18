import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ActivityTrackerService } from './activity-tracker.service.js'

const DEFAULT_USER_ID = 'default';

@Controller('activity')
export class ActivityTrackerController {
  constructor(private readonly activityTrackerService: ActivityTrackerService) {}

  @Get('active')
  getActiveSession() {
    return this.activityTrackerService.getActiveSession(DEFAULT_USER_ID);
  }

  @Get('history')
  list(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.activityTrackerService.list(DEFAULT_USER_ID, { search, category, dateFrom, dateTo });
  }

  @Post('start')
  start(
    @Body() body: { activityName: string; category: string; sourceEventId?: string; note?: string },
  ) {
    return this.activityTrackerService.start(DEFAULT_USER_ID, body);
  }

  @Post('stop/:id')
  stop(@Param('id', ParseUUIDPipe) id: string) {
    return this.activityTrackerService.stop(DEFAULT_USER_ID, id);
  }

  @Post('manual-log')
  manualLog(
    @Body() body: { activityName: string; category: string; startTime: string; endTime: string; note?: string },
  ) {
    return this.activityTrackerService.manualLog(DEFAULT_USER_ID, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { activityName?: string; category?: string; durationMinutes?: number; note?: string | null },
  ) {
    return this.activityTrackerService.update(DEFAULT_USER_ID, id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.activityTrackerService.softDelete(DEFAULT_USER_ID, id);
  }
}
