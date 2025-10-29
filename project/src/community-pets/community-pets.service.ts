import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityPetDto } from './dto/create-community-pet.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class CommunityPetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra una nueva mascota comunitaria y sus fotos.
   */
  async create(
    dto: CreateCommunityPetDto,
    uploadedById: number,
    fileUrls: string[],
  ) {
    const { communeId, specieId, breedId, ...primitiveData } = dto;

    try {
      const newCommunityPet = await this.prisma.$transaction(async (tx) => {
        const petData: Prisma.CommunityPetCreateInput = {
          ...primitiveData,
          commune: { connect: { id: communeId } },
          specie: { connect: { id: specieId } },
          ...(breedId && { breed: { connect: { id: breedId } } }),
        };

        const pet = await tx.communityPet.create({
          data: petData,
        });

        const imagesData = fileUrls.map((url, index) => ({
          communityPetId: pet.id,
          uploadedById: uploadedById,
          imageUrl: url,
          order: index,
          caption:
            index === 0
              ? `Foto principal de ${pet.name}`
              : `Foto ${index + 1} de ${pet.name}`,
        }));

        await tx.communityPetImage.createMany({
          data: imagesData,
        });

        return pet;
      });

      return newCommunityPet;
    } catch (error) {
      console.error('Error al registrar mascota comunitaria:', error);
      throw new InternalServerErrorException(
        'Error al registrar la mascota comunitaria.',
      );
    }
  }

  /**
   * Devuelve una lista de mascotas comunitarias.
   */
  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [communityPets, total] = await this.prisma.$transaction([
      this.prisma.communityPet.findMany({
        skip: skip,
        take: limit,
        include: {
          images: {
            take: 1,
            orderBy: { order: 'asc' },
          },
          commune: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.communityPet.count(),
    ]);

    return {
      data: communityPets,
      meta: {
        totalItems: total,
        itemCount: communityPets.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Devuelve el perfil completo de UNA mascota comunitaria.
   */
  async findOne(id: number) {
    const communityPet = await this.prisma.communityPet.findUnique({
      where: { id: id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        commune: true,
      },
    });

    if (!communityPet) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${id} no encontrada.`,
      );
    }

    return communityPet;
  }
}
