import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LostPetsService } from './lost-pets.service';
import { GetLostPetsDto } from './dto/get-lost-pets.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateSightingDto } from './dto/create-sighting.dto';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('lost-pets')
export class LostPetsController {
  constructor(
    private readonly lostPetsService: LostPetsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Endpoint público híbrido:
   * 1. Si recibe lat/lon -> Busca por cercanía (para el mapa).
   * 2. Si no -> Devuelve lista paginada estándar (para el feed).
   * GET /api/v1/lost-pets?lat=...&lon=... OR ?page=1
   */
  @Get()
  findAll(@Query() query: GetLostPetsDto) {
    if (query.lat && query.lon) {
      return this.lostPetsService.findNearby({
        lat: query.lat,
        lon: query.lon,
        radiusKm: query.radiusKm,
      });
    }

    return this.lostPetsService.findAll({
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Endpoint público para ver el detalle de UNA mascota perdida.
   * GET /api/v1/lost-pets/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lostPetsService.findOne(id);
  }

  /**
   * Endpoint protegido para reportar un avistamiento de una mascota perdida.
   * POST /api/v1/lost-pets/:id/sighting
   */
  @Post(':id/sighting')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './public/uploads/sightings',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `sighting-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  reportSighting(
    @Param('id', ParseIntPipe) lostPetId: number,
    @Req() req: AuthenticatedRequest,
    @Body() createSightingDto: CreateSightingDto,
    @UploadedFile(
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
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new InternalServerErrorException('Error al subir la foto.');
    }

    const sightedById = req.user.id;
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new InternalServerErrorException('APP_URL no configurada');
    }
    const imageUrl = `${appUrl}/${file.path.replace('public/', '')}`;

    return this.lostPetsService.reportSighting(
      lostPetId,
      sightedById,
      createSightingDto,
      imageUrl,
    );
  }

  /**
   * Endpoint protegido para que el DUEÑO marque la mascota como encontrada.
   * PATCH /api/v1/lost-pets/:id/found
   */
  @Patch(':id/found')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  markAsFound(
    @Param('id', ParseIntPipe) lostPetId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.lostPetsService.markAsFound(lostPetId, userId);
  }
}
