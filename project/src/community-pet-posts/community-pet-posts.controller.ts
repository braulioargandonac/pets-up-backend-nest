import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
} from '@nestjs/common';
import { CommunityPetPostsService } from './community-pet-posts.service';
import { CreateCommunityPetPostDto } from './dto/create-community-pet-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from '@prisma/client';
import { UpdateCommunityPetPostDto } from './dto/update-community-pet-post.dto';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class CommunityPetPostsController {
  constructor(
    private readonly postsService: CommunityPetPostsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './public/uploads/community/posts',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `post-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  createPost(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateCommunityPetPostDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({
            fileType: /image\/(jpeg|png|webp)/,
            skipMagicNumbersValidation: true,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const authorId = req.user.id;
    let imageUrl: string | undefined;

    if (file) {
      const appUrl = this.configService.get<string>('APP_URL');
      if (!appUrl) {
        throw new InternalServerErrorException('APP_URL not configured.');
      }
      imageUrl = `${appUrl}/${file.path.replace('public/', '')}`;
    }

    return this.postsService.createPost(
      authorId,
      createDto.communityPetId,
      createDto.content,
      imageUrl,
    );
  }

  /**
   * Endpoint protegido para dar "Like" a un post.
   * POST /api/v1/posts/:id/like
   */
  @Post(':id/like')
  @HttpCode(HttpStatus.CREATED) // 201 Created
  likePost(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const userId = req.user.id;
    return this.postsService.likePost(userId, postId);
  }

  /**
   * Endpoint protegido para quitar "Like" de un post.
   * DELETE /api/v1/posts/:id/like
   */
  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlikePost(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const userId = req.user.id;
    return this.postsService.unlikePost(userId, postId);
  }

  /**
   * Endpoint protegido para editar texto de un post.
   * PATCH /api/v1/posts/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  updatePost(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) postId: number,
    @Body() updateDto: UpdateCommunityPetPostDto,
  ) {
    const userId = req.user.id;
    return this.postsService.updatePost(userId, postId, updateDto.content);
  }

  /**
   * Endpoint protegido para AÑADIR o REEMPLAZAR la foto de un post.
   * POST /api/v1/posts/:id/photo
   */
  @Post(':id/photo')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './public/uploads/community/posts',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `post-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  updatePhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) postId: number,
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
    const userId = req.user.id;
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new InternalServerErrorException('APP_URL no configurada.');
    }
    const imageUrl = `${appUrl}/${file.path.replace('public/', '')}`;

    return this.postsService.updatePostPhoto(userId, postId, imageUrl);
  }

  /**
   * Endpoint protegido para ELIMINAR la foto de un post.
   * DELETE /api/v1/posts/:id/photo
   */
  @Delete(':id/photo')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  removePhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const userId = req.user.id;
    return this.postsService.removePostPhoto(userId, postId);
  }

  /**
   * Endpoint protegido para ELIMINAR un post.
   * DELETE /api/v1/posts/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  removePost(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const userId = req.user.id;
    return this.postsService.removePost(userId, postId);
  }
}
