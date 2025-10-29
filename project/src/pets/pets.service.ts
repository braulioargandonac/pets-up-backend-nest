import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

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
          order: index,
        }));

        await tx.petImage.createMany({
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
          isActive: true,
        },
        include: {
          images: {
            take: 1,
            orderBy: { createdAt: 'asc' },
            where: { isActive: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.pet.count({
        where: {
          statusId: 1,
          isActive: true,
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
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: id,
        isActive: true,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
          where: { isActive: true },
        },
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

  /**
   * Actualiza los datos de una mascota.
   * Solo el dueño puede hacerlo.
   */
  async update(petId: number, userId: number, updatePetDto: UpdatePetDto) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada.`);
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta mascota.',
      );
    }

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
      } = updatePetDto;

      const updateData: Prisma.PetUpdateInput = {
        ...primitiveData,
        ...(sizeId && { size: { connect: { id: sizeId } } }),
        ...(energyLevelId && {
          energyLevel: { connect: { id: energyLevelId } },
        }),
        ...(homeTypeId && { homeType: { connect: { id: homeTypeId } } }),
        ...(conditionId && { condition: { connect: { id: conditionId } } }),
        ...(statusId && { status: { connect: { id: statusId } } }),
        ...(specieId && { specie: { connect: { id: specieId } } }),
        ...(breedId && { breed: { connect: { id: breedId } } }),
        ...(hairTypeId && { hairType: { connect: { id: hairTypeId } } }),
        ...(communeId && { commune: { connect: { id: communeId } } }),
      };

      const updatedPet = await this.prisma.pet.update({
        where: { id: petId },
        data: updateData,
      });

      return updatedPet;
    } catch (error) {
      console.error('Error al actualizar la mascota:', error);
      throw new InternalServerErrorException('Error al actualizar la mascota.');
    }
  }

  /**
   * Desactiva una mascota.
   * Solo el dueño puede hacerlo.
   */
  async remove(petId: number, userId: number) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada.`);
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta mascota.',
      );
    }

    try {
      const [updatedPet] = await this.prisma.$transaction([
        this.prisma.pet.update({
          where: { id: petId },
          data: { isActive: false },
        }),

        this.prisma.lostPet.updateMany({
          where: { petId: petId, isResolved: false },
          data: { isResolved: true },
        }),
      ]);

      return updatedPet;
    } catch (error) {
      console.error('Error en el borrado lógico:', error);
      throw new InternalServerErrorException('Error al desactivar la mascota.');
    }
  }

  /**
   * Restaura (reactiva) una mascota que fue desactivada.
   * Solo el dueño puede hacerlo.
   */
  async restore(petId: number, userId: number) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada.`);
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para restaurar esta mascota.',
      );
    }

    if (pet.isActive) {
      throw new ConflictException('Esta mascota ya está activa.');
    }

    try {
      const restoredPet = await this.prisma.pet.update({
        where: { id: petId },
        data: {
          isActive: true,
        },
      });
      return restoredPet;
    } catch (error) {
      console.error('Error al restaurar la mascota:', error);
      throw new InternalServerErrorException('Error al restaurar la mascota.');
    }
  }
}
