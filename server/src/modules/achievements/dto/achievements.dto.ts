// server/src/modules/achievements/dto/achievements.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class AchievementDefinitionResponse {
  id!: string;
  title!: string;
  description!: string;
  requirementType!: string;
  requirementValue!: number;
  icon!: string;
  category!: string;
}

export class UserAchievementResponse {
  id!: string;
  userId!: string;
  achievementId!: string;
  progress!: number;
  unlockedAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

// Joined response for the grid view
export interface AchievementWithProgress extends AchievementDefinitionResponse {
  progress: number;
  unlockedAt: string | null;
  userAchievementId: string | null;
}

// Internal evaluate call
export class EvaluateEventDto {
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsNumber()
  eventValue!: number;
}
