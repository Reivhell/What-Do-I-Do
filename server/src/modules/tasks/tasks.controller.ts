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
import {
  TasksService,
  TaskStatus,
  TaskPriority,
  TaskView,
  ScheduleTaskInput,
} from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ScheduleTaskDto,
  BulkUpdateStatusDto,
  CreateSubtaskDto,
  UpdateSubtaskDto,
} from './dto/task.dto';

const DEFAULT_USER_ID = 'default';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@Query('view') view?: TaskView) {
    return this.tasksService.list(DEFAULT_USER_ID, view);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.getWithSubtasks(DEFAULT_USER_ID, id);
  }

  @Post()
  create(@Body() body: CreateTaskDto) {
    return this.tasksService.create(DEFAULT_USER_ID, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, DEFAULT_USER_ID, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.delete(id, DEFAULT_USER_ID);
  }

  @Post(':id/schedule')
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ScheduleTaskDto,
  ) {
    return this.tasksService.scheduleTask(DEFAULT_USER_ID, id, body);
  }

  @Patch('bulk/status')
  bulkUpdateStatus(@Body() body: BulkUpdateStatusDto) {
    return this.tasksService.bulkUpdateStatus(DEFAULT_USER_ID, body.taskIds, body.status);
  }

  @Post(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.archive(DEFAULT_USER_ID, id);
  }

  // ── Subtasks ──
  @Post(':id/subtasks')
  createSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateSubtaskDto,
  ) {
    return this.tasksService.createSubtask(id, DEFAULT_USER_ID, body.title);
  }

  @Patch('subtasks/:subtaskId')
  updateSubtask(
    @Param('subtaskId', ParseUUIDPipe) subtaskId: string,
    @Body() body: UpdateSubtaskDto,
  ) {
    return this.tasksService.updateSubtask(subtaskId, DEFAULT_USER_ID, body);
  }

  @Delete('subtasks/:subtaskId')
  deleteSubtask(@Param('subtaskId', ParseUUIDPipe) subtaskId: string) {
    return this.tasksService.deleteSubtask(subtaskId, DEFAULT_USER_ID);
  }
}