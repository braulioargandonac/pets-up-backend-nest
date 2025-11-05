import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityPetDto } from './dto/create-community-pet.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UpdateCommunityPetDto } from './dto/update-community-pet.dto';

@Injectable()
export class CommunityPetsService {
  private readonly MAX_PHOTOS_PER_PET = 10;

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
          createdBy: { connect: { id: uploadedById } },
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
        where: { isActive: true },
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
      this.prisma.communityPet.count({
        where: { isActive: true },
      }),
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
    const communityPet = await this.prisma.communityPet.findFirst({
      where: {
        id: id,
        isActive: true,
      },
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

  /**
   * Actualiza el perfil de una mascota comunitaria.
   * Solo el creador original puede hacerlo.
   */
  async update(
    communityPetId: number,
    userId: number,
    dto: UpdateCommunityPetDto,
  ) {
    const pet = await this.prisma.communityPet.findUnique({
      where: { id: communityPetId },
    });

    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${communityPetId} no encontrada.`,
      );
    }

    if (pet.createdById !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta mascota comunitaria.',
      );
    }

    const { communeId, specieId, breedId, ...primitiveData } = dto;

    try {
      const updateData: Prisma.CommunityPetUpdateInput = {
        ...primitiveData,
        ...(communeId && { commune: { connect: { id: communeId } } }),
        ...(specieId && { specie: { connect: { id: specieId } } }),
        ...(breedId && { breed: { connect: { id: breedId } } }),
      };

      const updatedPet = await this.prisma.communityPet.update({
        where: { id: communityPetId },
        data: updateData,
      });

      return updatedPet;
    } catch (error) {
      console.error('Error al actualizar mascota comunitaria:', error);
      throw new InternalServerErrorException('Error al actualizar la mascota.');
    }
  }

  /**
   * Añade nuevas fotos a una mascota comunitaria, respetando el límite.
   * Solo el creador puede hacerlo.
   */
  async addPhotos(userId: number, communityPetId: number, fileUrls: string[]) {
    const pet = await this.prisma.communityPet.findFirst({
      where: { id: communityPetId, isActive: true },
    });

    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria activa con ID ${communityPetId} no encontrada.`,
      );
    }
    if (pet.createdById !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta mascota.',
      );
    }

    const currentActivePhotoCount = await this.prisma.communityPetImage.count({
      where: { communityPetId: communityPetId, isActive: true },
    });

    if (currentActivePhotoCount + fileUrls.length > this.MAX_PHOTOS_PER_PET) {
      throw new BadRequestException(
        `No puedes subir ${fileUrls.length} fotos. Ya tienes ${currentActivePhotoCount} y el límite es ${this.MAX_PHOTOS_PER_PET}.`,
      );
    }

    const lastOrder = await this.prisma.communityPetImage.aggregate({
      _max: { order: true },
      where: { communityPetId: communityPetId },
    });
    const nextOrder = (lastOrder._max.order ?? -1) + 1;

    const imagesData = fileUrls.map((url, index) => ({
      communityPetId: communityPetId,
      imageUrl: url,
      order: nextOrder + index,
      uploadedById: userId,
    }));

    try {
      await this.prisma.communityPetImage.createMany({
        data: imagesData,
      });
      return { message: `${fileUrls.length} fotos añadidas.` };
    } catch (error) {
      console.error('Error al añadir fotos:', error);
      throw new InternalServerErrorException('Error al guardar las fotos.');
    }
  }

  /**
   * Desactiva (borrado lógico) una foto de una mascota comunitaria.
   * Solo el creador puede hacerlo.
   */
  async deactivatePhoto(
    userId: number,
    communityPetId: number,
    photoId: number,
  ) {
    const petImage = await this.prisma.communityPetImage.findFirst({
      where: {
        id: photoId,
        communityPetId: communityPetId,
      },
      include: {
        communityPet: true,
      },
    });

    if (!petImage) {
      throw new NotFoundException(
        `Foto con ID ${photoId} no encontrada para la mascota ${communityPetId}.`,
      );
    }

    if (petImage.communityPet.createdById !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta mascota.',
      );
    }

    const activePhotoCount = await this.prisma.communityPetImage.count({
      where: {
        communityPetId: communityPetId,
        isActive: true,
      },
    });

    if (activePhotoCount <= 1) {
      throw new ConflictException('No puedes eliminar la última foto.');
    }

    try {
      await this.prisma.communityPetImage.update({
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
   * Reordena las fotos activas de una mascota comunitaria.
   * Solo el creador puede hacerlo.
   */
  async reorderPhotos(
    userId: number,
    communityPetId: number,
    photoIdsInOrder: number[],
  ) {
    const pet = await this.prisma.communityPet.findFirst({
      where: { id: communityPetId, isActive: true },
      include: {
        images: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria activa con ID ${communityPetId} no encontrada.`,
      );
    }
    if (pet.createdById !== userId) {
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
        this.prisma.communityPetImage.update({
          where: { id: photoId },
          data: { order: index },
        }),
      );
      await this.prisma.$transaction(updatePromises);

      return this.prisma.communityPetImage.findMany({
        where: {
          communityPetId: communityPetId,
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

  /**
   * Desactiva el perfil de una mascota comunitaria.
   * Solo el creador original puede hacerlo.
   */
  async remove(communityPetId: number, userId: number) {
    const pet = await this.prisma.communityPet.findFirst({
      where: {
        id: communityPetId,
      },
    });

    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${communityPetId} no encontrada.`,
      );
    }

    if (pet.createdById !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta mascota.',
      );
    }

    try {
      await this.prisma.communityPet.update({
        where: { id: communityPetId },
        data: { isActive: false },
      });
    } catch (error) {
      console.error('Error en el borrado lógico:', error);
      throw new InternalServerErrorException('Error al desactivar la mascota.');
    }

    return;
  }

  /**
   * Restaura (reactiva) el perfil de una mascota comunitaria.
   * Solo el creador original puede hacerlo.
   */
  async restore(communityPetId: number, userId: number) {
    const pet = await this.prisma.communityPet.findUnique({
      where: { id: communityPetId },
    });

    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${communityPetId} no encontrada.`,
      );
    }

    if (pet.createdById !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para restaurar esta mascota.',
      );
    }

    if (pet.isActive) {
      throw new ConflictException('Esta mascota comunitaria ya está activa.');
    }

    try {
      const restoredPet = await this.prisma.communityPet.update({
        where: { id: communityPetId },
        data: { isActive: true },
      });
      return restoredPet;
    } catch (error) {
      console.error('Error al restaurar la mascota:', error);
      throw new InternalServerErrorException('Error al restaurar la mascota.');
    }
  }
}
