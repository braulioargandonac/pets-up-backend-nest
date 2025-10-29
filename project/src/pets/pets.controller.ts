import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { LostPetsService } from 'src/lost-pets/lost-pets.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ReportLostPetDto } from 'src/lost-pets/dto/report-lost-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';

type AuthenticatedUser = Omit<User, 'password'>;

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('pets')
@UseGuards(AuthGuard('jwt'))
export class PetsController {
  constructor(
    private readonly petsService: PetsService,
    private readonly configService: ConfigService,
    private readonly lostPetsService: LostPetsService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `pet-image-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  create(
    @Body() createPetDto: CreatePetDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
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
    const ownerId = req.user.id;

    const appUrl = this.configService.get<string>('APP_URL');
    const fileUrls = files.map((file) => {
      const path = file.path.replace('public/', '');
      return `${appUrl}/${path}`;
    });

    return this.petsService.create(createPetDto, ownerId, fileUrls);
  }

  /**
   * Endpoint público para listar mascotas (para el "Tinder")
   * GET /pets?page=1&limit=10
   */
  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.petsService.findAll(paginationQuery);
  }

  /**
   * Endpoint público para ver el detalle de UNA mascota
   * GET /pets/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.petsService.findOne(id);
  }

  /**
   * Endpoint para reportar una mascota (Pet) como perdida (LostPet).
   * POST /api/v1/pets/:id/report-lost
   */
  @Post(':id/report-lost')
  reportLostPet(
    @Param('id', ParseIntPipe) petId: number,
    @Req() req: AuthenticatedRequest,
    @Body() reportLostPetDto: ReportLostPetDto,
  ) {
    const userId = req.user.id;
    return this.lostPetsService.reportLostPet(petId, userId, reportLostPetDto);
  }

  /**
   * Endpoint protegido para actualizar una mascota.
   * PATCH /api/v1/pets/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) petId: number,
    @Req() req: AuthenticatedRequest,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    const userId = req.user.id;
    return this.petsService.update(petId, userId, updatePetDto);
  }

  /**
   * Endpoint protegido para eliminar una mascota.
   * DELETE /api/v1/pets/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) petId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.petsService.remove(petId, userId);
  }

  /**
   * Endpoint protegido para restaurar (reactivar) una mascota.
   * PATCH /api/v1/pets/:id/restore
   */
  @Patch(':id/restore')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  restore(
    @Param('id', ParseIntPipe) petId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.petsService.restore(petId, userId);
  }

  /**
   * Endpoint protegido para desactivar una foto de una mascota.
   * DELETE /api/v1/pets/:petId/photos/:photoId
   */
  @Delete(':petId/photos/:photoId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivatePhoto(
    @Req() req: AuthenticatedRequest,
    @Param('petId', ParseIntPipe) petId: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    const userId = req.user.id;
    return this.petsService.deactivatePhoto(userId, petId, photoId);
  }

  /**
   * Endpoint protegido para añadir más fotos a una mascota existente.
   * POST /api/v1/pets/:petId/photos
   */
  @Post(':petId/photos')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `pet-image-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  addPhotos(
    @Req() req: AuthenticatedRequest,
    @Param('petId', ParseIntPipe) petId: number,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
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

    return this.petsService.addPhotos(userId, petId, fileUrls);
  }

  /**
   * Endpoint protegido para reordenar las fotos de una mascota.
   * PATCH /api/v1/pets/:petId/photos/order
   */
  @Patch(':petId/photos/order')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  reorderPhotos(
    @Req() req: AuthenticatedRequest,
    @Param('petId', ParseIntPipe) petId: number,
    @Body() reorderPhotosDto: ReorderPhotosDto,
  ) {
    const userId = req.user.id;
    return this.petsService.reorderPhotos(
      userId,
      petId,
      reorderPhotosDto.photoIds,
    );
  }
}
