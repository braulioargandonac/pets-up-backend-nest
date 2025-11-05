import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
} from '@nestjs/common';
import { CommunityPetCommentsService } from './community-pet-comments.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommunityPetCommentsController {
  constructor(private readonly commentsService: CommunityPetCommentsService) {}

  /**
   * Endpoint protegido para crear un nuevo comentario.
   * POST /api/v1/comments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createComment(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateCommentDto,
  ) {
    const authorId = req.user.id;
    return this.commentsService.createComment(
      authorId,
      createDto.postId,
      createDto.content,
    );
  }

  /**
   * Endpoint protegido para editar un comentario.
   * PATCH /api/v1/comments/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateComment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) commentId: number,
    @Body() updateDto: UpdateCommentDto,
  ) {
    const authorId = req.user.id;
    return this.commentsService.updateComment(
      authorId,
      commentId,
      updateDto.content,
    );
  }

  /**
   * Endpoint protegido para eliminar un comentario.
   * DELETE /api/v1/comments/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeComment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) commentId: number,
  ) {
    const authorId = req.user.id;
    return this.commentsService.removeComment(authorId, commentId);
  }
}
