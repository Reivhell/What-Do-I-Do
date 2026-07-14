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
import { HabitsService } from './habits.service';
import { CreateHabitDto, UpdateHabitDto, LogHabitDto, HabitResponse, HabitLogResponse } from './dto/habit.dto';

const DEFAULT_USER_ID = 'default';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string): Promise<HabitResponse[]> {
    return this.habitsService.findAll(userId || DEFAULT_USER_ID);
  }

  @Post()
  async create(
    @Body() dto: CreateHabitDto,
    @Query('userId') userId?: string,
  ): Promise<HabitResponse> {
    return this.habitsService.create(userId || DEFAULT_USER_ID, dto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ): Promise<HabitResponse | null> {
    return this.habitsService.findOne(id, userId || DEFAULT_USER_ID);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHabitDto,
    @Query('userId') userId?: string,
  ): Promise<HabitResponse> {
    return this.habitsService.update(id, userId || DEFAULT_USER_ID, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ): Promise<void> {
    return this.habitsService.delete(id, userId || DEFAULT_USER_ID);
  }

  @Post(':id/log')
  async logHabit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LogHabitDto,
    @Query('userId') userId?: string,
  ): Promise<HabitLogResponse> {
    return this.habitsService.logHabit(id, userId || DEFAULT_USER_ID, dto);
  }

  @Get(':id/logs')
  async getLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<HabitLogResponse[]> {
    return this.habitsService.getLogs(id, userId || DEFAULT_USER_ID, from && to ? { from, to } : undefined);
  }
}