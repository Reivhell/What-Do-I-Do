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
import { HabitsService } from './habits.service.js'
import { CreateHabitDto, UpdateHabitDto, LogHabitDto, HabitResponse, HabitLogResponse } from './dto/habit.dto.js'

const DEFAULT_USER_ID = 'default';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  async findAll(): Promise<HabitResponse[]> {
    return this.habitsService.findAll(DEFAULT_USER_ID);
  }

  @Post()
  async create(@Body() dto: CreateHabitDto): Promise<HabitResponse> {
    return this.habitsService.create(DEFAULT_USER_ID, dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<HabitResponse | null> {
    return this.habitsService.findOne(id, DEFAULT_USER_ID);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHabitDto): Promise<HabitResponse> {
    return this.habitsService.update(id, DEFAULT_USER_ID, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.habitsService.delete(id, DEFAULT_USER_ID);
  }

  @Post(':id/log')
  async logHabit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: LogHabitDto): Promise<HabitLogResponse> {
    return this.habitsService.logHabit(id, DEFAULT_USER_ID, dto);
  }

  @Get(':id/logs')
  async getLogs(@Param('id', ParseUUIDPipe) id: string, @Query('from') from?: string, @Query('to') to?: string): Promise<HabitLogResponse[]> {
    const range = from || to ? { from: from || '', to: to || '' } : undefined;
    return this.habitsService.getLogs(id, DEFAULT_USER_ID, range);
  }

  @Get(':id/with-logs')
  async findWithLogs(@Param('id', ParseUUIDPipe) id: string): Promise<HabitResponse & { logs: HabitLogResponse[] } | null> {
    return this.habitsService.getHabitWithLogs(id, DEFAULT_USER_ID);
  }
}
