import {
  Controller, Get, Post, Body, Param, ParseUUIDPipe,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { EvaluateEventDto, AchievementWithProgress } from './dto/achievements.dto';

const DEFAULT_USER_ID = 'default';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async findAll(): Promise<AchievementWithProgress[]> {
    return this.achievementsService.findAll(DEFAULT_USER_ID);
  }

  @Get('unlocked')
  async findUnlocked(): Promise<AchievementWithProgress[]> {
    return this.achievementsService.findUnlocked(DEFAULT_USER_ID);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AchievementWithProgress | null> {
    return this.achievementsService.findOne(DEFAULT_USER_ID, id);
  }

  @Post('evaluate')
  async evaluate(@Body() dto: EvaluateEventDto): Promise<string[]> {
    return this.achievementsService.evaluate(DEFAULT_USER_ID, dto.eventType, dto.eventValue);
  }
}
