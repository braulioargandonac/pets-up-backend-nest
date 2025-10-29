import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class ReorderPhotosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  photoIds: number[];
}
