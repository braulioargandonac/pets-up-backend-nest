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
  Get,
  Param,
  ParseIntPipe,
  Query,
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
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

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
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 5, {
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
}
