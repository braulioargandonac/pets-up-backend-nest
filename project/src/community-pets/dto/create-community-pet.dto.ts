import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Temperament } from '@prisma/client';

export class CreateCommunityPetDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  distinguishingMarks?: string;

  /**
   * Recibe un string de temperamentos separados por coma.
   * Ej: "JUGUETON,TIMIDO,BUENO_CON_NINOS"
   */
  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (typeof value !== 'string') {
      return [];
    }
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v in Temperament);
  })
  @IsEnum(Temperament, { each: true })
  temperamentTags?: Temperament[];

  @IsString()
  @IsOptional()
  careInstructions?: string;

  @IsInt()
  @IsNotEmpty()
  communeId: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsInt()
  @IsNotEmpty()
  specieId: number;

  @IsInt()
  @IsOptional()
  breedId?: number;
}
