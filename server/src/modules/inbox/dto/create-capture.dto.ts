import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateCaptureDto {
  @IsString()
  @IsNotEmpty()
  rawText!: string;

  @IsOptional()
  @IsEnum(['manual', 'voice', 'share_intent'])
  source?: 'manual' | 'voice' | 'share_intent';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
