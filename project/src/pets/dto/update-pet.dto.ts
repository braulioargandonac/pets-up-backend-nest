import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdatePetDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: Date;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  distinguishingMarks?: string;

  @IsInt()
  @IsOptional()
  communeId?: number;

  @IsInt()
  @IsOptional()
  sizeId?: number;

  @IsInt()
  @IsOptional()
  energyLevelId?: number;

  @IsInt()
  @IsOptional()
  homeTypeId?: number;

  @IsInt()
  @IsOptional()
  conditionId?: number;

  @IsInt()
  @IsOptional()
  statusId?: number;

  @IsInt()
  @IsOptional()
  specieId?: number;

  @IsInt()
  @IsOptional()
  breedId?: number;

  @IsInt()
  @IsOptional()
  hairTypeId?: number;

  @IsBoolean()
  @IsOptional()
  isPetFriendly?: boolean;

  @IsBoolean()
  @IsOptional()
  isKidFriendly?: boolean;

  @IsBoolean()
  @IsOptional()
  isSterilized?: boolean;
}
