import { IsNotEmpty, IsString, MinLength, IsInt } from 'class-validator';

export class CreateCommentDto {
  @IsInt()
  @IsNotEmpty()
  postId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;
}
