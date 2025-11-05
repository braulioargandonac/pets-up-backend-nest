import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Temperament } from '@prisma/client';

export class UpdateCommunityPetDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  distinguishingMarks?: string;

  @IsString()
  @IsOptional()
  careInstructions?: string;

  @IsInt()
  @IsOptional()
  communeId?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsInt()
  @IsOptional()
  specieId?: number;

  @IsInt()
  @IsOptional()
  breedId?: number;

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (typeof value !== 'string') {
      return undefined;
    }
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v in Temperament);
  })
  @IsEnum(Temperament, { each: true })
  @IsOptional()
  temperamentTags?: Temperament[];
}
