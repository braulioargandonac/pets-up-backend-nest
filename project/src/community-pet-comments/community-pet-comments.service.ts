import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunityPetCommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo comentario en un post.
   */
  async createComment(authorId: number, postId: number, content: string) {
    const post = await this.prisma.communityPetPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado.`);
    }

    const newComment = await this.prisma.communityPetComment.create({
      data: {
        postId: postId,
        authorId: authorId,
        content: content,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return newComment;
  }

  /**
   * Devuelve una lista paginada de comentarios para un post.
   */
  async findAllForPost(postId: number, paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const post = await this.prisma.communityPetPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado.`);
    }

    const [comments, total] = await this.prisma.$transaction([
      this.prisma.communityPetComment.findMany({
        skip: skip,
        take: limit,
        where: { postId: postId },
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.communityPetComment.count({
        where: { postId: postId },
      }),
    ]);

    return {
      data: comments,
      meta: {
        totalItems: total,
        itemCount: comments.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Actualiza un comentario.
   * Solo el autor puede hacerlo.
   */
  async updateComment(authorId: number, commentId: number, content?: string) {
    const comment = await this.prisma.communityPetComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException(
        `Comentario con ID ${commentId} no encontrado.`,
      );
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException(
        'No tienes permiso para editar este comentario.',
      );
    }
    if (content === undefined) {
      return comment;
    }

    return this.prisma.communityPetComment.update({
      where: { id: commentId },
      data: { content: content },
    });
  }

  /**
   * Elimina un comentario.
   * Solo el autor puede hacerlo.
   */
  async removeComment(authorId: number, commentId: number) {
    const comment = await this.prisma.communityPetComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException(
        `Comentario con ID ${commentId} no encontrado.`,
      );
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este comentario.',
      );
    }

    try {
      await this.prisma.communityPetComment.delete({
        where: { id: commentId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return;
      }
      throw error;
    }
    return;
  }
}
