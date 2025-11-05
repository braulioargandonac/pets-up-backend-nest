import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  content?: string;
}
