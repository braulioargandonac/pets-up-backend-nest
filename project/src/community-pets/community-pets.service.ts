import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityPetDto } from './dto/create-community-pet.dto';
import { UpdateCommunityPetDto } from './dto/update-community-pet.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

type GeoResult = {
  id: number;
  latitude: number;
  longitude: number;
};

@Injectable()
export class CommunityPetsService {
  private readonly MAX_PHOTOS_PER_PET = 10;

  constructor(private prisma: PrismaService) {}

  /**
   * Registra una nueva mascota comunitaria (Con PostGIS).
   */
  async create(
    dto: CreateCommunityPetDto,
    uploadedById: number,
    fileUrls: string[],
  ) {
    const {
      communeId,
      specieId,
      breedId,
      latitude,
      longitude,
      temperamentTags,
      ...primitiveData
    } = dto;

    const location = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;

    try {
      const newCommunityPet = await this.prisma.$transaction(async (tx) => {
        const result = await tx.$queryRaw<[{ id: number }]>`
          INSERT INTO "CommunityPet" (
            "name", "description", "color", "distinguishingMarks", "careInstructions",
            "communeId", "address", "location",
            "specieId", "breedId", "createdById", "isActive",
            "temperamentTags", "createdAt"
          ) VALUES (
            ${primitiveData.name}, ${primitiveData.description}, ${primitiveData.color}, 
            ${primitiveData.distinguishingMarks}, ${primitiveData.careInstructions},
            ${communeId}, ${primitiveData.address}, ${location},
            ${specieId}, ${breedId}, ${uploadedById}, true,
            ${temperamentTags}::"Temperament"[], NOW()
          )
          RETURNING id
        `;

        const petId = result[0].id;

        const imagesData = fileUrls.map((url, index) => ({
          communityPetId: petId,
          uploadedById: uploadedById,
          imageUrl: url,
          order: index,
          caption: index === 0 ? `Foto principal` : `Foto ${index + 1}`,
          isActive: true,
        }));

        await tx.communityPetImage.createMany({
          data: imagesData,
        });

        return tx.communityPet.findUnique({
          where: { id: petId },
          include: { images: true, commune: true },
        });
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
   * Lista paginada con coordenadas decodificadas.
   */
  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const geoResults = await this.prisma.$queryRaw<GeoResult[]>`
      SELECT 
        id, 
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM "CommunityPet"
      WHERE "isActive" = true
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const total = await this.prisma.communityPet.count({
      where: { isActive: true },
    });

    if (geoResults.length === 0) {
      return {
        data: [],
        meta: {
          totalItems: total,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: 0,
          currentPage: page,
        },
      };
    }

    const ids = geoResults.map((r) => r.id);
    const petsData = await this.prisma.communityPet.findMany({
      where: { id: { in: ids } },
      include: {
        images: {
          take: 1,
          orderBy: { order: 'asc' },
          where: { isActive: true },
        },
        commune: true,
      },
    });

    const mergedData = geoResults.map((geo) => {
      const details = petsData.find((p) => p.id === geo.id);
      return {
        ...details,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    });

    return {
      data: mergedData,
      meta: {
        totalItems: total,
        itemCount: mergedData.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Detalle de mascota con coordenadas.
   */
  async findOne(id: number) {
    const geoResult = await this.prisma.$queryRaw<GeoResult[]>`
      SELECT id, ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude
      FROM "CommunityPet"
      WHERE id = ${id} AND "isActive" = true
    `;

    if (geoResult.length === 0) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${id} no encontrada.`,
      );
    }

    const petDetails = await this.prisma.communityPet.findUnique({
      where: { id: id },
      include: {
        images: {
          orderBy: { order: 'asc' },
          where: { isActive: true },
        },
        commune: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      ...petDetails,
      latitude: geoResult[0].latitude,
      longitude: geoResult[0].longitude,
    };
  }

  /**
   * Actualiza perfil (Maneja PostGIS si cambian coordenadas).
   */
  async update(
    communityPetId: number,
    userId: number,
    dto: UpdateCommunityPetDto,
  ) {
    const pet = await this.prisma.communityPet.findUnique({
      where: { id: communityPetId },
    });

    if (!pet) throw new NotFoundException('No encontrada');
    if (pet.createdById !== userId)
      throw new ForbiddenException('No autorizado');

    const {
      communeId,
      specieId,
      breedId,
      latitude,
      longitude,
      temperamentTags,
      ...primitiveData
    } = dto;

    try {
      if (latitude && longitude) {
        const location = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
        await this.prisma.$queryRaw`
          UPDATE "CommunityPet"
          SET location = ${location}
          WHERE id = ${communityPetId}
        `;
      }

      if (temperamentTags) {
        await this.prisma.$queryRaw`
          UPDATE "CommunityPet"
          SET "temperamentTags" = ${temperamentTags}::"Temperament"[]
          WHERE id = ${communityPetId}
        `;
      }

      if (
        Object.keys(primitiveData).length > 0 ||
        communeId ||
        specieId ||
        breedId
      ) {
        await this.prisma.communityPet.update({
          where: { id: communityPetId },
          data: {
            ...primitiveData,
            ...(communeId && { commune: { connect: { id: communeId } } }),
            ...(specieId && { specie: { connect: { id: specieId } } }),
            ...(breedId && { breed: { connect: { id: breedId } } }),
          },
        });
      }

      return this.findOne(communityPetId);
    } catch (error) {
      console.error('Error al actualizar:', error);
      throw new InternalServerErrorException('Error al actualizar la mascota.');
    }
  }

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
      throw new BadRequestException(`Límite de fotos excedido.`);
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
      isActive: true,
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

  async deactivatePhoto(
    userId: number,
    communityPetId: number,
    photoId: number,
  ) {
    const petImage = await this.prisma.communityPetImage.findFirst({
      where: { id: photoId, communityPetId: communityPetId },
      include: { communityPet: true },
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
      where: { communityPetId: communityPetId, isActive: true },
    });

    if (activePhotoCount <= 1)
      throw new ConflictException('No puedes eliminar la última foto.');

    await this.prisma.communityPetImage.update({
      where: { id: photoId },
      data: { isActive: false },
    });
  }

  async reorderPhotos(
    userId: number,
    communityPetId: number,
    photoIdsInOrder: number[],
  ) {
    const pet = await this.prisma.communityPet.findFirst({
      where: { id: communityPetId, isActive: true },
      include: { images: { where: { isActive: true }, select: { id: true } } },
    });

    if (!pet) throw new NotFoundException('Mascota no encontrada.');
    if (pet.createdById !== userId)
      throw new ForbiddenException('No autorizado.');

    const currentActivePhotoIds = new Set(pet.images.map((img) => img.id));
    const inputPhotoIds = new Set(photoIdsInOrder);

    if (currentActivePhotoIds.size !== inputPhotoIds.size)
      throw new BadRequestException('Cantidad de IDs incorrecta.');
    for (const id of inputPhotoIds) {
      if (!currentActivePhotoIds.has(id))
        throw new BadRequestException(`ID ${id} inválido.`);
    }

    const updatePromises = photoIdsInOrder.map((photoId, index) =>
      this.prisma.communityPetImage.update({
        where: { id: photoId },
        data: { order: index },
      }),
    );
    await this.prisma.$transaction(updatePromises);

    return this.prisma.communityPetImage.findMany({
      where: { communityPetId: communityPetId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async remove(communityPetId: number, userId: number) {
    const pet = await this.prisma.communityPet.findFirst({
      where: { id: communityPetId },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada.');
    if (pet.createdById !== userId)
      throw new ForbiddenException('No autorizado.');

    await this.prisma.communityPet.update({
      where: { id: communityPetId },
      data: { isActive: false },
    });
  }

  async restore(communityPetId: number, userId: number) {
    const pet = await this.prisma.communityPet.findUnique({
      where: { id: communityPetId },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada.');
    if (pet.createdById !== userId)
      throw new ForbiddenException('No autorizado.');
    if (pet.isActive) throw new ConflictException('Ya está activa.');

    const restoredPet = await this.prisma.communityPet.update({
      where: { id: communityPetId },
      data: { isActive: true },
    });
    return restoredPet;
  }
}
