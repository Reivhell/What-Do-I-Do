import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { GoalsService } from './goals.service';

const DEFAULT_USER_ID = 'default';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  /* ── Goals ── */

  @Get()
  list() {
    return this.goalsService.listGoalsWithMilestones(DEFAULT_USER_ID);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.getGoal(DEFAULT_USER_ID, id);
  }

  @Post()
  create(@Body() body: { title: string; description?: string; targetDate?: string }) {
    return this.goalsService.createGoal(DEFAULT_USER_ID, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { title?: string; description?: string | null; targetDate?: string | null; status?: string; progressPercent?: number },
  ) {
    return this.goalsService.updateGoal(DEFAULT_USER_ID, id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.deleteGoal(DEFAULT_USER_ID, id);
  }

  /* ── Milestones (nested under /goals/:goalId/milestones) ── */

  @Get(':goalId/milestones')
  listMilestones(@Param('goalId', ParseUUIDPipe) goalId: string) {
    return this.goalsService.listMilestones(goalId);
  }

  @Post(':goalId/milestones')
  createMilestone(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() body: { title: string; targetDate?: string },
  ) {
    return this.goalsService.createMilestone(goalId, body);
  }

  @Patch(':goalId/milestones/:milestoneId')
  updateMilestone(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() body: { title?: string; targetDate?: string | null; isCompleted?: boolean },
  ) {
    return this.goalsService.updateMilestone(goalId, milestoneId, body);
  }

  @Delete(':goalId/milestones/:milestoneId')
  deleteMilestone(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.goalsService.deleteMilestone(goalId, milestoneId);
  }
}
