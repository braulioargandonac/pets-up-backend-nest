import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  private readonly MAX_PHOTOS_PER_PET = 10;
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

  /**
   * Desactiva una foto de una mascota.
   * Valida que el usuario sea el dueño y que no sea la última foto.
   */
  async deactivatePhoto(userId: number, petId: number, photoId: number) {
    const petImage = await this.prisma.petImage.findFirst({
      where: {
        id: photoId,
        petId: petId,
      },
      include: {
        pet: true,
      },
    });

    if (!petImage) {
      throw new NotFoundException(
        `Foto con ID ${photoId} no encontrada para la mascota ${petId}.`,
      );
    }

    if (petImage.pet.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta mascota.',
      );
    }

    const activePhotoCount = await this.prisma.petImage.count({
      where: {
        petId: petId,
        isActive: true,
      },
    });

    if (activePhotoCount <= 1) {
      throw new ConflictException(
        'No puedes eliminar la última foto de la mascota.',
      );
    }

    try {
      await this.prisma.petImage.update({
        where: { id: photoId },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Error al desactivar la foto:', error);
      throw new InternalServerErrorException('Error al desactivar la foto.');
    }

    return;
  }

  /**
   * Añade nuevas fotos a una mascota, respetando el límite total.
   */
  async addPhotos(userId: number, petId: number, fileUrls: string[]) {
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        isActive: true,
      },
    });

    if (!pet) {
      throw new NotFoundException(
        `Mascota activa con ID ${petId} no encontrada.`,
      );
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta mascota.',
      );
    }

    const currentActivePhotoCount = await this.prisma.petImage.count({
      where: {
        petId: petId,
        isActive: true,
      },
    });

    if (currentActivePhotoCount + fileUrls.length > this.MAX_PHOTOS_PER_PET) {
      throw new BadRequestException(
        `No puedes subir ${fileUrls.length} fotos. Ya tienes ${currentActivePhotoCount} y el límite es ${this.MAX_PHOTOS_PER_PET}.`,
      );
    }

    const lastOrder = await this.prisma.petImage.aggregate({
      _max: { order: true },
      where: { petId: petId },
    });
    const nextOrder = (lastOrder._max.order ?? -1) + 1;

    const imagesData = fileUrls.map((url, index) => ({
      petId: petId,
      imageUrl: url,
      order: nextOrder + index,
      isActive: true,
    }));

    try {
      await this.prisma.petImage.createMany({
        data: imagesData,
      });

      const createdImages = await this.prisma.petImage.findMany({
        where: {
          petId: petId,
          imageUrl: { in: fileUrls },
        },
      });
      return createdImages;
    } catch (error) {
      console.error('Error al añadir fotos:', error);
      throw new InternalServerErrorException('Error al guardar las fotos.');
    }
  }

  /**
   * Reordena las fotos activas de una mascota.
   */
  async reorderPhotos(
    userId: number,
    petId: number,
    photoIdsInOrder: number[],
  ) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, isActive: true },
      include: {
        images: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(
        `Mascota activa con ID ${petId} no encontrada.`,
      );
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta mascota.',
      );
    }

    const currentActivePhotoIds = new Set(pet.images.map((img) => img.id));
    const inputPhotoIds = new Set(photoIdsInOrder);

    if (currentActivePhotoIds.size !== inputPhotoIds.size) {
      throw new BadRequestException(
        `La cantidad de IDs (${inputPhotoIds.size}) no coincide con las fotos activas (${currentActivePhotoIds.size}).`,
      );
    }

    for (const id of inputPhotoIds) {
      if (!currentActivePhotoIds.has(id)) {
        throw new BadRequestException(
          `El ID de foto ${id} no pertenece a esta mascota o no está activa.`,
        );
      }
    }

    try {
      const updatePromises = photoIdsInOrder.map((photoId, index) =>
        this.prisma.petImage.update({
          where: { id: photoId },
          data: { order: index },
        }),
      );

      await this.prisma.$transaction(updatePromises);

      return this.prisma.petImage.findMany({
        where: {
          petId: petId,
          isActive: true,
        },
        orderBy: {
          order: 'asc',
        },
      });
    } catch (error) {
      console.error('Error al reordenar las fotos:', error);
      throw new InternalServerErrorException('Error al reordenar las fotos.');
    }
  }
}
