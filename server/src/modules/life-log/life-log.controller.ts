import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { LifeLogService } from './life-log.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto/life-log.dto';

const DEFAULT_USER_ID = 'default';

@Controller('life-log')
export class LifeLogController {
  constructor(private readonly lifeLogService: LifeLogService) {}

  // ── Timeline ──

  @Get('timeline')
  async getTimeline(
    @Query('userId') userId?: string,
    @Query('date') date?: string,
    @Query('sources') sources?: string,
    @Query('search') search?: string,
  ) {
    const sourceArray = sources ? sources.split(',') : undefined;
    return this.lifeLogService.getTimeline(
      userId || DEFAULT_USER_ID,
      date,
      sourceArray,
      search,
    );
  }

  @Get('daily-summary')
  async getDailySummary(
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    return this.lifeLogService.getDailySummary(
      userId || DEFAULT_USER_ID,
      date || today,
    );
  }

  // ── Annotations ──

  @Get('annotations')
  async findAllAnnotations(
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    return this.lifeLogService.findAllAnnotations(userId || DEFAULT_USER_ID, date);
  }

  @Post('annotations')
  async createAnnotation(
    @Body() dto: CreateAnnotationDto,
    @Query('userId') userId?: string,
  ) {
    return this.lifeLogService.createAnnotation(userId || DEFAULT_USER_ID, dto);
  }

  @Patch('annotations/:id')
  async updateAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnotationDto,
    @Query('userId') userId?: string,
  ) {
    return this.lifeLogService.updateAnnotation(id, userId || DEFAULT_USER_ID, dto);
  }

  @Delete('annotations/:id')
  async deleteAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.lifeLogService.deleteAnnotation(id, userId || DEFAULT_USER_ID);
  }

  // ── Export ──

  @Get('export')
  async exportTimeline(
    @Query('userId') userId?: string,
    @Query('format') format?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.lifeLogService.exportTimeline(
      userId || DEFAULT_USER_ID,
      format || 'json',
      dateFrom,
      dateTo,
    );
  }
}
