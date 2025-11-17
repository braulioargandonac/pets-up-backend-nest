import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class ReorderVetPhotosDto {
  /**
   * Un array con los IDs de las fotos, en el nuevo orden deseado.
   * La foto en la posición [0] será marcada como el logo.
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  photoIds: number[];
}
