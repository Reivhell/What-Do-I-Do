import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type HabitLogStatus = 'done' | 'skipped' | 'missed';

export interface RepeatRule {
  freq: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endCondition?: { type: 'count'; count: number } | { type: 'date'; date: string };
}

export class EndConditionDto {
  @IsEnum(['count', 'date'])
  type!: 'count' | 'date';

  @IsOptional()
  count?: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class RepeatRuleDto {
  @IsEnum(['daily', 'weekly', 'monthly'])
  freq!: 'daily' | 'weekly' | 'monthly';

  @IsNotEmpty()
  interval!: number;

  @IsOptional()
  daysOfWeek?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EndConditionDto)
  endCondition?: EndConditionDto;
}

export class CreateHabitDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'custom'])
  targetFrequency!: HabitFrequency;

  @ValidateNested()
  @Type(() => RepeatRuleDto)
  repeatRule!: RepeatRuleDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  linkedGoalId?: string;
}

export class UpdateHabitDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'custom'])
  targetFrequency?: HabitFrequency;

  @IsOptional()
  @ValidateNested()
  @Type(() => RepeatRuleDto)
  repeatRule?: RepeatRuleDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  linkedGoalId?: string | null;
}

export class LogHabitDto {
  @IsDateString()
  date!: string;

  @IsEnum(['done', 'skipped', 'missed'])
  status!: HabitLogStatus;

  @IsOptional()
  @IsUUID()
  linkedEventId?: string;

  @IsOptional()
  @IsUUID()
  linkedSessionId?: string;
}

export interface HabitResponse {
  id: string;
  userId: string;
  name: string;
  targetFrequency: HabitFrequency;
  repeatRule: RepeatRule;
  currentStreak: number;
  bestStreak: number;
  completionCount: number;
  missedCount: number;
  notes: string | null;
  linkedGoalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLogResponse {
  id: string;
  habitId: string;
  date: string;
  status: 'done' | 'skipped' | 'missed';
  linkedEventId: string | null;
  linkedSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitWithLogs extends HabitResponse {
  logs: HabitLogResponse[];
}