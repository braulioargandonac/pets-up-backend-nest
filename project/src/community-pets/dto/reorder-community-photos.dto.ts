import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class ReorderCommunityPhotosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  photoIds: number[];
}
