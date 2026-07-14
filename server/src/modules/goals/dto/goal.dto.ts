import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsDateString()
  targetDate?: string | null;

  @IsOptional()
  @IsEnum(['active', 'completed', 'archived', 'at_risk'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent?: number;
}

export class CreateMilestoneDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class ScheduleMilestoneDto {
  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export interface GoalResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  milestones?: MilestoneResponse[];
}

export interface MilestoneResponse {
  id: string;
  goalId: string;
  title: string;
  targetDate: string | null;
  isCompleted: boolean;
  generatedEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedItem {
  type: 'habit' | 'task';
  id: string;
  title: string;
  status: string;
}
