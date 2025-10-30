import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCommunityPetPostDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  content?: string;
}
