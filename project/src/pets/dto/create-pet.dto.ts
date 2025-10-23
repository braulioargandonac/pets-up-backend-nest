import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePetDto {
  @IsString()
  @MinLength(2)
  name: string;

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
  @IsNotEmpty()
  statusId: number;

  @IsInt()
  @IsNotEmpty()
  specieId: number;

  @IsInt()
  @IsOptional()
  breedId?: number;

  @IsInt()
  @IsOptional()
  hairTypeId?: number;

  @IsBoolean()
  @IsOptional()
  isPetFriendly?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isKidFriendly?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isSterilized?: boolean = true;
}
