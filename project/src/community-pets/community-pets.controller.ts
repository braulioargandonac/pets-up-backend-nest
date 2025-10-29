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
}
