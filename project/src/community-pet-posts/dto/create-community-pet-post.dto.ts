import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCommunityPetPostDto {
  @IsInt()
  @IsNotEmpty()
  communityPetId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
