import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { LogType } from '@prisma/client';

export class CreateLogDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  content: string;

  @IsEnum(LogType)
  @IsNotEmpty()
  logType: LogType;
}
