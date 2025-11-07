import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  Min,
} from 'class-validator';

export class FindVetsQueryDto {
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lon: number;

  /**
   * Radio de búsqueda en kilómetros.
   * @default 5
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  radiusKm?: number = 5;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceId?: number;

  /**
   * Si es 'true', filtra solo las que están abiertas ahora.
   * @default false
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  openNow?: boolean = false;
}
