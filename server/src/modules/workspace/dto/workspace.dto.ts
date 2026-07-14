import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export type WidgetType =
  | 'current_activity'
  | 'planner_preview'
  | 'tasks_preview'
  | 'habit_streak'
  | 'money_summary'
  | 'weekly_chart'
  | 'insights'
  | 'notes'
  | 'quick_actions';

export class WidgetConfigItemDto {
  @ApiProperty({ enum: ['current_activity', 'planner_preview', 'tasks_preview', 'habit_streak', 'money_summary', 'weekly_chart', 'insights', 'notes', 'quick_actions'] })
  @IsString()
  widgetType: WidgetType = 'current_activity';

  @ApiProperty()
  @IsBoolean()
  visible: boolean = true;

  @ApiProperty()
  @IsNumber()
  position: number = 0;

  @ApiProperty()
  @IsBoolean()
  pinned: boolean = false;
}

export class CreatePresetDto {
  @ApiProperty()
  @IsString()
  name = '';

  @ApiPropertyOptional({ type: [WidgetConfigItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetConfigItemDto)
  widgetConfig?: WidgetConfigItemDto[];
}

export class UpdatePresetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: [WidgetConfigItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetConfigItemDto)
  widgetConfig?: WidgetConfigItemDto[];
}

export class ActivatePresetDto {
  // No additional fields needed - activation is just by ID in URL
}