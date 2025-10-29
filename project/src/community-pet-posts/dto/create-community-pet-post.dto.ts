import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommunityPetPostDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
