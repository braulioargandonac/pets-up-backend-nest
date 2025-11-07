import {
  IsArray,
  IsEmail,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOpeningTimeDto } from './create-opening-time.dto';

export class CreateVetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  googleMapsUrl?: string;

  // --- Ubicación (para PostGIS) ---
  @IsInt()
  @IsNotEmpty()
  communeId: number;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  // --- Servicios y Horarios ---
  @IsArray()
  @IsNotEmpty()
  @IsInt({ each: true })
  serviceIds: number[];

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningTimeDto)
  openingTimes: CreateOpeningTimeDto[];
}
