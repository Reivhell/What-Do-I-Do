import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PlannerService, PlannerStatus, ViewRange } from './planner.service';

const DEFAULT_USER_ID = 'default';

@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Get()
  listByDate(
    @Query('date') date: string,
    @Query('range') range?: string,
  ) {
    return this.plannerService.listByRange(
      DEFAULT_USER_ID,
      (range as ViewRange) || 'daily',
      date,
    );
  }

  @Post()
  create(
    @Body()
    body: {
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      category?: string;
      priority?: string;
      notes?: string;
      reminderTime?: string;
    },
  ) {
    return this.plannerService.create(DEFAULT_USER_ID, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { title?: string; date?: string; startTime?: string; endTime?: string; durationMinutes?: number; category?: string; priority?: string; notes?: string; status?: PlannerStatus; reminderTime?: string },
  ) {
    return this.plannerService.update(id, DEFAULT_USER_ID, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.plannerService.delete(id, DEFAULT_USER_ID);
  }

  @Post(':id/start')
  startEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.plannerService.startEvent(id, DEFAULT_USER_ID);
  }

  @Post('from-task/:taskId')
  scheduleFromTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: { date: string; startTime: string; endTime: string; durationMinutes: number },
  ) {
    return this.plannerService.scheduleFromTask(DEFAULT_USER_ID, taskId, body);
  }

  @Post('from-goal-milestone/:milestoneId')
  scheduleFromMilestone(
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() body: { date: string; startTime: string; endTime: string; durationMinutes: number },
  ) {
    return this.plannerService.scheduleFromMilestone(DEFAULT_USER_ID, milestoneId, body);
  }
}
