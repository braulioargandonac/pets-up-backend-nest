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

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('community-pets/:communityPetId/posts')
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
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
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
      communityPetId,
      createDto.content,
      imageUrl,
    );
  }
}
