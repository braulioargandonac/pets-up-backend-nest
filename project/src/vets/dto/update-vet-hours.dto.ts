import { IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOpeningTimeDto } from './create-opening-time.dto';

export class UpdateVetHoursDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningTimeDto)
  openingTimes: CreateOpeningTimeDto[];
}
