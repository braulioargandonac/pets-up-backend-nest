import { IsInt, IsString, Max, Min, Matches } from 'class-validator';

export class CreateOpeningTimeDto {
  @IsInt()
  @Min(1)
  @Max(7) // Lunes=1, Domingo=7
  dayOfWeekId: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de inicio debe estar en formato HH:mm (ej: 09:00)',
  })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de fin debe estar en formato HH:mm (ej: 23:59)',
  })
  endTime: string;
}
