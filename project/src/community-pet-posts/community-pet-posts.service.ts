import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

const PUBLIC_ROOT = '/usr/src/app/public';

@Injectable()
export class CommunityPetPostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(
    authorId: number,
    communityPetId: number,
    content: string,
    imageUrl?: string,
  ) {
    const communityPet = await this.prisma.communityPet.findUnique({
      where: { id: communityPetId },
    });

    if (!communityPet) {
      throw new NotFoundException(
        `Community Pet with ID ${communityPetId} not found.`,
      );
    }

    const newPost = await this.prisma.communityPetPost.create({
      data: {
        authorId: authorId,
        communityPetId: communityPetId,
        content: content,
        imageUrl: imageUrl,
      },
    });

    return newPost;
  }

  async findAllForPet(
    communityPetId: number,
    paginationQuery: PaginationQueryDto,
  ) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const communityPet = await this.prisma.communityPet.findUnique({
      where: { id: communityPetId },
    });

    if (!communityPet) {
      throw new NotFoundException(
        `Community Pet with ID ${communityPetId} not found.`,
      );
    }

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.communityPetPost.findMany({
        skip: skip,
        take: limit,
        where: {
          communityPetId: communityPetId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.communityPetPost.count({
        where: {
          communityPetId: communityPetId,
        },
      }),
    ]);

    return {
      data: posts,
      meta: {
        totalItems: total,
        itemCount: posts.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async likePost(userId: number, postId: number) {
    const post = await this.prisma.communityPetPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado.`);
    }

    return this.prisma.communityPetPostLike.upsert({
      where: {
        postId_userId: { postId, userId },
      },
      update: {},
      create: {
        postId: postId,
        userId: userId,
      },
    });
  }

  async unlikePost(userId: number, postId: number) {
    try {
      await this.prisma.communityPetPostLike.delete({
        where: {
          postId_userId: { postId, userId },
        },
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
  }

  async updatePost(userId: number, postId: number, content?: string) {
    const post = await this.prisma.communityPetPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado.`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este post.');
    }

    if (content === undefined) {
      return post;
    }

    return this.prisma.communityPetPost.update({
      where: { id: postId },
      data: {
        content: content,
      },
    });
  }

  async updatePostPhoto(userId: number, postId: number, newImageUrl: string) {
    const post = await this.prisma.communityPetPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado.`);
    }

    if (post.authorId !== userId) {
      const newFileName = newImageUrl.split('/').pop();
      if (newFileName) {
        const newPath = join(
          PUBLIC_ROOT,
          'uploads/community/posts',
          newFileName,
        );
        try {
          await unlink(newPath);
        } catch (error) {
          console.error('Error con unlink:', error);
        }
      }
      throw new ForbiddenException('No tienes permiso para editar este post.');
    }

    const oldImageUrl = post.imageUrl;
    const updatedPost = await this.prisma.communityPetPost.update({
      where: { id: postId },
      data: {
        imageUrl: newImageUrl,
      },
    });

    if (oldImageUrl) {
      const oldFileName = oldImageUrl.split('/').pop();
      if (oldFileName) {
        try {
          const oldPath = join(
            PUBLIC_ROOT,
            'uploads/community/posts',
            oldFileName,
          );
          await unlink(oldPath);
        } catch (error) {
          if (error instanceof Error) {
            console.error('Error al borrar foto antigua:', error.message);
          } else {
            console.error('Error desconocido al borrar foto antigua:', error);
          }
        }
      }
    }

    return updatedPost;
  }

  async removePostPhoto(userId: number, postId: number) {
    const post = await this.prisma.communityPetPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado.`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este post.');
    }

    const oldImageUrl = post.imageUrl;

    if (!oldImageUrl) {
      return;
    }

    await this.prisma.communityPetPost.update({
      where: { id: postId },
      data: {
        imageUrl: null,
      },
    });

    const oldFileName = oldImageUrl.split('/').pop();

    if (oldFileName) {
      try {
        const oldPath = join(
          PUBLIC_ROOT,
          'uploads/community/posts',
          oldFileName,
        );
        await unlink(oldPath);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error al borrar foto física:', error.message);
        } else {
          console.error('Error desconocido al borrar foto física:', error);
        }
      }
    }
    return;
  }

  /**
   * Elimina un post, sus comentarios y sus likes.
   * Solo el autor puede hacerlo.
   */
  async removePost(userId: number, postId: number) {
    const post = await this.prisma.communityPetPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post con ID ${postId} no encontrado.`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este post.',
      );
    }

    const oldImageUrl = post.imageUrl;

    try {
      await this.prisma.communityPetPost.delete({
        where: { id: postId },
      });

      if (oldImageUrl) {
        const oldFileName = oldImageUrl.split('/').pop();
        if (oldFileName) {
          const oldPath = join(
            PUBLIC_ROOT,
            'uploads/community/posts',
            oldFileName,
          );
          try {
            await unlink(oldPath);
          } catch (error) {
            if (error instanceof Error) {
              console.error(`Error al borrar archivo físico: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al eliminar el post:', error);
      throw new InternalServerErrorException('Error al eliminar el post.');
    }
    return;
  }
}
