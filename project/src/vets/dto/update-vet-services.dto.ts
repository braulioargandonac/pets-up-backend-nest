import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class UpdateVetServicesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  serviceIds: number[];
}
