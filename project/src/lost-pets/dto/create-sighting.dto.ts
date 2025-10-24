import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class CreateSightingDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  @IsOptional()
  description?: string;
}
