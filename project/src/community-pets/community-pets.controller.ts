import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  InternalServerErrorException,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Patch,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { CommunityPetsService } from './community-pets.service';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CreateCommunityPetDto } from './dto/create-community-pet.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CommunityPetPostsService } from 'src/community-pet-posts/community-pet-posts.service';
import { UpdateCommunityPetDto } from './dto/update-community-pet.dto';
import { ReorderCommunityPhotosDto } from './dto/reorder-community-photos.dto';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('community-pets')
@UseGuards(AuthGuard('jwt'))
export class CommunityPetsController {
  constructor(
    private readonly communityPetsService: CommunityPetsService,
    private readonly configService: ConfigService,
    private readonly postsService: CommunityPetPostsService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './public/uploads/community',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `community-pet-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateCommunityPetDto,
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

    const uploadedById = req.user.id;
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new InternalServerErrorException('APP_URL no está configurada.');
    }

    const fileUrls = files.map(
      (file) => `${appUrl}/${file.path.replace('public/', '')}`,
    );

    return this.communityPetsService.create(createDto, uploadedById, fileUrls);
  }

  /**
   * Endpoint público para listar mascotas comunitarias (paginado).
   * GET /api/v1/community-pets?page=1&limit=10
   */
  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.communityPetsService.findAll(paginationQuery);
  }

  /**
   * Endpoint público para ver el detalle de UNA mascota comunitaria.
   * GET /api/v1/community-pets/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.communityPetsService.findOne(id);
  }

  /**
   * Endpoint público para obtener los posts del "Muro" (paginado).
   * GET /api/v1/community-pets/:id/posts?page=1&limit=10
   */
  @Get(':id/posts')
  findAllPosts(
    @Param('id', ParseIntPipe) communityPetId: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postsService.findAllForPet(communityPetId, paginationQuery);
  }

  /**
   * Endpoint protegido para actualizar el perfil de una mascota comunitaria.
   * PATCH /api/v1/community-pets/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) communityPetId: number,
    @Req() req: AuthenticatedRequest,
    @Body() updateDto: UpdateCommunityPetDto,
  ) {
    const userId = req.user.id;
    return this.communityPetsService.update(communityPetId, userId, updateDto);
  }

  /**
   * Endpoint protegido para AÑADIR MÁS fotos a una mascota comunitaria.
   * POST /api/v1/community-pets/:id/photos
   */
  @Post(':id/photos')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './public/uploads/community',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `community-pet-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  addPhotos(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) communityPetId: number,
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
      throw new InternalServerErrorException('APP_URL no configurada.');
    }

    const fileUrls = files.map(
      (file) => `${appUrl}/${file.path.replace('public/', '')}`,
    );

    return this.communityPetsService.addPhotos(
      userId,
      communityPetId,
      fileUrls,
    );
  }

  /**
   * Endpoint protegido para "eliminar" (desactivar) una foto.
   * DELETE /api/v1/community-pets/:id/photos/:photoId
   */
  @Delete(':id/photos/:photoId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivatePhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) communityPetId: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    const userId = req.user.id;
    return this.communityPetsService.deactivatePhoto(
      userId,
      communityPetId,
      photoId,
    );
  }

  /**
   * Endpoint protegido para reordenar las fotos.
   * PATCH /api/v1/community-pets/:id/photos/order
   */
  @Patch(':id/photos/order')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  reorderPhotos(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) communityPetId: number,
    @Body() reorderDto: ReorderCommunityPhotosDto,
  ) {
    const userId = req.user.id;
    return this.communityPetsService.reorderPhotos(
      userId,
      communityPetId,
      reorderDto.photoIds,
    );
  }

  /**
   * Endpoint protegido para "eliminar" (desactivar) un perfil de mascota comunitaria.
   * DELETE /api/v1/community-pets/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) communityPetId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.communityPetsService.remove(communityPetId, userId);
  }

  /**
   * Endpoint protegido para restaurar (reactivar) un perfil de mascota comunitaria.
   * PATCH /api/v1/community-pets/:id/restore
   */
  @Patch(':id/restore')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  restore(
    @Param('id', ParseIntPipe) communityPetId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.communityPetsService.restore(communityPetId, userId);
  }
}
