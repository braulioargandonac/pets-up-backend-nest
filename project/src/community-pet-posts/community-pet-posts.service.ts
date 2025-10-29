import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
