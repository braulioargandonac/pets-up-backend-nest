import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
  Body,
  Patch,
  Delete,
  BadRequestException,
  FileTypeValidator,
  InternalServerErrorException,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { VetsService } from './vets.service';
import { Role } from 'generated/prisma';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role as RoleEnum } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateVetDto } from './dto/create-vet.dto';
import { FindVetsQueryDto } from './dto/find-vets-query.dto';
import { UpdateVetDto } from './dto/update-vet.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { ReorderVetPhotosDto } from './dto/reorder-vet-photos.dto';
import { UpdateVetServicesDto } from './dto/update-vet-services.dto';
import { UpdateVetHoursDto } from './dto/update-vet-hours.dto';

type AuthenticatedUser = { id: number; email: string; roles: Role[] };
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('vets')
export class VetsController {
  constructor(
    private readonly vetsService: VetsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Endpoint público para buscar veterinarias por proximidad y filtros.
   * GET /api/v1/vets?lat=...&lon=...&radiusKm=...
   */
  @Get()
  findAll(@Query() query: FindVetsQueryDto) {
    return this.vetsService.findNearby(query);
  }

  /**
   * Endpoint público para ver el detalle de UNA veterinaria.
   * GET /api/v1/vets/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vetsService.findOne(id);
  }

  /**
   * Endpoint protegido (VET_OWNER) para registrar una nueva veterinaria.
   * POST /api/v1/vets
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() createVetDto: CreateVetDto) {
    const userId = req.user.id;
    return this.vetsService.createVet(userId, createVetDto);
  }

  /**
   * Endpoint protegido (VET_OWNER) para actualizar el perfil de la veterinaria.
   * PATCH /api/v1/vets/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.OK)
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
    @Body() updateVetDto: UpdateVetDto,
  ) {
    const userId = req.user.id;
    return this.vetsService.updateVet(userId, vetId, updateVetDto);
  }

  /**
   * Endpoint protegido (VET_OWNER) para desactivar una veterinaria.
   * DELETE /api/v1/vets/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
  ) {
    const userId = req.user.id;
    return this.vetsService.removeVet(userId, vetId);
  }

  /**
   * Endpoint protegido (VET_OWNER) para AÑADIR MÁS fotos (logo/galería) a una veterinaria.
   * POST /api/v1/vets/:id/photos
   */
  @Post(':id/photos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './public/uploads/vets',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `vet-image-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  addPhotos(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({
            fileType: /image\/(jpeg|png|webp)/,
            skipMagicNumbersValidation: true,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes subir al menos una foto.');
    }

    const userId = req.user.id;
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new InternalServerErrorException('APP_URL no está configurada.');
    }

    const fileUrls = files.map(
      (file) => `${appUrl}/${file.path.replace('public/', '')}`,
    );

    return this.vetsService.addPhotos(userId, vetId, fileUrls);
  }

  /**
   * Endpoint protegido (VET_OWNER) para ELIMINAR una foto de la veterinaria.
   * DELETE /api/v1/vets/:id/photos/:photoId
   */
  @Delete(':id/photos/:photoId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removePhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    const userId = req.user.id;
    return this.vetsService.removePhoto(userId, vetId, photoId);
  }

  /**
   * Endpoint protegido (VET_OWNER) para reordenar las fotos de la veterinaria.
   * PATCH /api/v1/vets/:id/photos/order
   */
  @Patch(':id/photos/order')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.OK)
  reorderPhotos(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
    @Body() reorderDto: ReorderVetPhotosDto,
  ) {
    const userId = req.user.id;
    return this.vetsService.reorderPhotos(userId, vetId, reorderDto.photoIds);
  }

  /**
   * Endpoint protegido (VET_OWNER) para REEMPLAZAR los servicios de una veterinaria.
   * PATCH /api/v1/vets/:id/services
   */
  @Patch(':id/services')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.OK)
  updateServices(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
    @Body() updateServicesDto: UpdateVetServicesDto,
  ) {
    const userId = req.user.id;
    return this.vetsService.updateVetServices(
      userId,
      vetId,
      updateServicesDto.serviceIds,
    );
  }

  /**
   * Endpoint protegido (VET_OWNER) para REEMPLAZAR los horarios de una veterinaria.
   * PATCH /api/v1/vets/:id/hours
   */
  @Patch(':id/hours')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.OK)
  updateHours(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
    @Body() updateHoursDto: UpdateVetHoursDto,
  ) {
    const userId = req.user.id;
    return this.vetsService.updateVetHours(
      userId,
      vetId,
      updateHoursDto.openingTimes,
    );
  }
}
