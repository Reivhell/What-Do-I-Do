import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GoalsService } from './goals.service.js'
import { CreateGoalDto, UpdateGoalDto, CreateMilestoneDto, UpdateMilestoneDto, ScheduleMilestoneDto } from './dto/goal.dto.js'

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
  create(@Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(DEFAULT_USER_ID, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.updateGoal(DEFAULT_USER_ID, id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.deleteGoal(DEFAULT_USER_ID, id);
  }

  /* ── Milestones ── */

  @Get(':goalId/milestones')
  listMilestones(@Param('goalId', ParseUUIDPipe) goalId: string) {
    return this.goalsService.listMilestones(goalId);
  }

  @Post(':goalId/milestones')
  createMilestone(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.goalsService.createMilestone(goalId, dto);
  }

  @Patch(':goalId/milestones/:milestoneId')
  updateMilestone(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.goalsService.updateMilestone(goalId, milestoneId, dto);
  }

  @Delete(':goalId/milestones/:milestoneId')
  deleteMilestone(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.goalsService.deleteMilestone(goalId, milestoneId);
  }

  /* ── Extended endpoints ── */

  @Post(':goalId/milestones/:milestoneId/schedule')
  scheduleMilestone(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: ScheduleMilestoneDto,
  ) {
    return this.goalsService.scheduleMilestone(DEFAULT_USER_ID, goalId, milestoneId, dto);
  }

  @Get(':id/linked-items')
  linkedItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.getLinkedItems(DEFAULT_USER_ID, id);
  }
}
