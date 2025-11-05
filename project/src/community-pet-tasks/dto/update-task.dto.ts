import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
