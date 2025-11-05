import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LogType } from '@prisma/client';

export class UpdateLogDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  content?: string;

  @IsEnum(LogType)
  @IsOptional()
  logType?: LogType;
}
