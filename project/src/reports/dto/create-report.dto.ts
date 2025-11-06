import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isOnlyOneTarget', async: false })
export class IsOnlyOneTarget implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as CreateReportDto;
    const targets = [
      dto.reportedPetId,
      dto.reportedCommunityPetId,
      dto.reportedPostId,
      dto.reportedCommentId,
      dto.reportedUserId,
    ];
    const providedTargets = targets.filter((target) => target != null).length;

    return providedTargets === 1;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Debe proporcionar exactamente un ID de contenido a reportar (ej. reportedPetId, reportedPostId, etc.)';
  }
}

export class CreateReportDto {
  @IsInt()
  @IsNotEmpty()
  typeId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  })
  description: string;

  @IsInt()
  @IsOptional()
  reportedPetId?: number;

  @IsInt()
  @IsOptional()
  reportedCommunityPetId?: number;

  @IsInt()
  @IsOptional()
  reportedPostId?: number;

  @IsInt()
  @IsOptional()
  reportedCommentId?: number;

  @IsInt()
  @IsOptional()
  reportedUserId?: number;

  @Validate(IsOnlyOneTarget)
  private readonly isOnlyOneTarget: undefined;
}
