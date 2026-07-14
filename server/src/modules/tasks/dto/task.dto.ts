import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

// Use const objects instead of enums for runtime values
export const TaskStatus = {
  INBOX: 'inbox' as const,
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
  ARCHIVED: 'archived' as const,
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  title = '';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Object.values(TaskPriority) })
  @IsOptional()
  @IsEnum(Object.values(TaskPriority))
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.dueDate !== undefined && o.dueDate !== '')
  dueDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Object.values(TaskStatus) })
  @IsOptional()
  @IsEnum(Object.values(TaskStatus))
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: Object.values(TaskPriority) })
  @IsOptional()
  @IsEnum(Object.values(TaskPriority))
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.dueDate !== undefined && o.dueDate !== '')
  dueDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleTaskDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsString()
  date = '';

  @ApiProperty({ description: 'Start time in HH:MM format (24h)' })
  @IsString()
  startTime = '';

  @ApiProperty({ description: 'End time in HH:MM format (24h)' })
  @IsString()
  endTime = '';

  @ApiProperty({ description: 'Duration in minutes' })
  @Type(() => Number)
  durationMinutes = 0;
}

export class BulkUpdateStatusDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  taskIds: string[] = [];

  @ApiProperty({ enum: Object.values(TaskStatus) })
  @IsEnum(Object.values(TaskStatus))
  status = TaskStatus.INBOX;
}

export class CreateSubtaskDto {
  @ApiProperty()
  @IsString()
  title = '';
}

export class UpdateSubtaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}