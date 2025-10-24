import {
  IsDate,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReportLostPetDto {
  @IsInt()
  @IsNotEmpty()
  communeId: number;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsDate()
  @IsNotEmpty()
  lostAt: Date;

  @IsString()
  @IsOptional()
  description?: string;
}
