import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAnnotationDto {
  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateAnnotationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timestamp?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
