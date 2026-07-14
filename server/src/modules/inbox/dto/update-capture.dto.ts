import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';

export class UpdateCaptureDto {
  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsEnum(['unprocessed', 'processed', 'archived'])
  status?: 'unprocessed' | 'processed' | 'archived';
}
