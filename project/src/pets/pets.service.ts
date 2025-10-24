import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPetDto: CreatePetDto,
    ownerId: number,
    fileUrls: string[],
  ) {
    try {
      const {
        sizeId,
        energyLevelId,
        homeTypeId,
        conditionId,
        statusId,
        specieId,
        breedId,
        hairTypeId,
        communeId,
        ...primitiveData
      } = createPetDto;

      const newPet = await this.prisma.$transaction(async (tx) => {
        const petData: Prisma.PetCreateInput = {
          ...primitiveData,
          owner: {
            connect: { id: ownerId },
          },
          ...(communeId && { commune: { connect: { id: communeId } } }),
          ...(sizeId && { size: { connect: { id: sizeId } } }),
          ...(energyLevelId && {
            energyLevel: { connect: { id: energyLevelId } },
          }),
          ...(homeTypeId && { homeType: { connect: { id: homeTypeId } } }),
          ...(conditionId && {
            condition: { connect: { id: conditionId } },
          }),
          ...(statusId && { status: { connect: { id: statusId } } }),
          ...(specieId && { specie: { connect: { id: specieId } } }),
          ...(breedId && { breed: { connect: { id: breedId } } }),
          ...(hairTypeId && { hairType: { connect: { id: hairTypeId } } }),
        };

        const pet = await tx.pet.create({
          data: petData,
        });

        const imagesData = fileUrls.map((url, index) => ({
          petId: pet.id,
          imageUrl: url,
          caption:
            index === 0
              ? `Foto principal de ${pet.name}`
              : `Foto ${index + 1} de ${pet.name}`,
        }));

        await tx.image.createMany({
          data: imagesData,
        });

        return pet;
      });

      return newPet;
    } catch (error) {
      console.error('Error al crear la mascota:', error);
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalServerErrorException(
          `Error de validación de Prisma: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Error al crear la mascota en la base de datos.',
      );
    }
  }

  /**
   * Devuelve una lista paginada de mascotas para el feed principal.
   */
  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;
    const [pets, total] = await this.prisma.$transaction([
      this.prisma.pet.findMany({
        skip: skip,
        take: limit,
        where: {
          statusId: 1,
        },
        include: {
          images: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.pet.count({
        where: {
          statusId: 1,
        },
      }),
    ]);

    return {
      data: pets,
      meta: {
        totalItems: total,
        itemCount: pets.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Devuelve el perfil completo de UNA mascota.
   * Optimizado para usar catálogos en el frontend.
   */
  async findOne(id: number) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: id },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            shortDescription: true,
          },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
    }
    return pet;
  }
}
