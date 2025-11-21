import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVetDto } from './dto/create-vet.dto';
import { Prisma } from '@prisma/client';
import { FindVetsQueryDto } from './dto/find-vets-query.dto';
import { UpdateVetDto } from './dto/update-vet.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { CreateOpeningTimeDto } from './dto/create-opening-time.dto';

const PUBLIC_ROOT = '/usr/src/app/public';

@Injectable()
export class VetsService {
  private readonly MAX_PHOTOS_PER_VET = 5;

  constructor(private prisma: PrismaService) {}

  /**
   * Helper privado para verificar propiedad.
   */
  private async checkVetOwnership(userId: number, vetId: number) {
    const vet = await this.prisma.vet.findUnique({
      where: { id: vetId },
    });
    if (!vet) {
      throw new NotFoundException(`Veterinaria con ID ${vetId} no encontrada.`);
    }
    if (vet.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta veterinaria.',
      );
    }
    return vet;
  }

  /**
   * Devuelve una lista de veterinarias filtrada por proximidad,
   * servicios y horario de atención.
   */
  async findNearby(query: FindVetsQueryDto) {
    const { lat, lon, radiusKm = 5, serviceId, openNow = false } = query;

    const radiusInMeters = radiusKm * 1000;
    const userLocation = Prisma.sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`;

    const today = new Date().getDay();
    const dayOfWeekId = today === 0 ? 7 : today;
    const now = new Date();
    now.setHours(now.getUTCHours() - 3);
    const currentTime = now.toTimeString().substr(0, 5);

    let openNowJoin = Prisma.empty;
    let openNowWhere = Prisma.empty;

    if (openNow) {
      const now = new Date();
      now.setHours(now.getUTCHours() - 3);

      openNowJoin = Prisma.sql`
        INNER JOIN "VetOpeningTime" AS "horario"
          ON "v"."id" = "horario"."vetId"
      `;
      openNowWhere = Prisma.sql`
        AND "horario"."dayOfWeekId" = ${dayOfWeekId}
        AND (
          ("horario"."startTime" <= "horario"."endTime" AND "horario"."startTime" <= ${currentTime} AND "horario"."endTime" >= ${currentTime})
          OR
          ("horario"."startTime" > "horario"."endTime" AND ("horario"."startTime" <= ${currentTime} OR "horario"."endTime" >= ${currentTime}))
        )
      `;
    }

    let serviceJoin = Prisma.empty;
    let serviceWhere = Prisma.empty;

    if (serviceId) {
      serviceJoin = Prisma.sql`
        INNER JOIN "VetService" AS "servicio"
          ON "v"."id" = "servicio"."vetId"
      `;
      serviceWhere = Prisma.sql`
        AND "servicio"."serviceId" = ${serviceId}
      `;
    }

    try {
      const vets = await this.prisma.$queryRaw`
        SELECT
          "v"."id", "v"."name", "v"."address", "v"."isVerified", "v"."googleMapsUrl",
          ST_X("v"."location"::geometry) AS "longitude",
          ST_Y("v"."location"::geometry) AS "latitude",
          ST_Distance("v"."location", ${userLocation}) AS "distanceInMeters",
          (
            SELECT COUNT(*) > 0 
            FROM "VetOpeningTime" as "vot"
            WHERE "vot"."vetId" = "v"."id"
              AND "vot"."dayOfWeekId" = ${dayOfWeekId}
              AND (
                ("vot"."startTime" <= "vot"."endTime" AND "vot"."startTime" <= ${currentTime} AND "vot"."endTime" >= ${currentTime})
                OR
                ("vot"."startTime" > "vot"."endTime" AND ("vot"."startTime" <= ${currentTime} OR "vot"."endTime" >= ${currentTime}))
              )
          ) as "isOpen"
          
        FROM "Vet" AS "v"
        
        ${serviceJoin}
        ${openNowJoin}

        WHERE
          ST_DWithin(
            "v"."location",
            ${userLocation},
            ${radiusInMeters}
          )
          AND "v"."isVerified" = true
          AND "v"."isActive" = true

          ${serviceWhere}
          ${openNowWhere}

        ORDER BY "distanceInMeters" ASC
        LIMIT 20
      `;

      return vets;
    } catch (error) {
      console.error('Error en la búsqueda geoespacial:', error);
      throw new InternalServerErrorException('Error al buscar veterinarias.');
    }
  }

  /**
   * Devuelve el detalle completo de UNA veterinaria.
   */
  async findOne(id: number) {
    const vet = await this.prisma.vet.findFirst({
      where: {
        id: id,
        isActive: true,
      },
      include: {
        commune: true,
        images: {
          orderBy: { order: 'asc' },
        },
        vetServices: {
          include: {
            service: true,
          },
        },
        vetOpeningTimes: {
          include: {
            dayOfWeek: true,
          },
          orderBy: { dayOfWeekId: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!vet) {
      throw new NotFoundException(`Veterinaria con ID ${id} no encontrada.`);
    }

    return vet;
  }

  /**
   * Crea una nueva veterinaria, sus servicios y horarios.
   */
  async createVet(userId: number, dto: CreateVetDto) {
    const {
      communeId,
      latitude,
      longitude,
      serviceIds,
      openingTimes,
      name,
      address,
      phone,
      email,
      description,
      googleMapsUrl,
    } = dto;

    // Convertimos Lat/Lon a formato PostGIS Point
    const locationQuery = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
    try {
      const newVetId = await this.prisma.$transaction(async (tx) => {
        const vetResult = await tx.$queryRaw<[{ id: number }]>`
          INSERT INTO "Vet" (
            "name", "address", "phone", "email", "description", "googleMapsUrl",
            "communeId", "userId", "location",
            "isVerified", "isActive", "howToGoCount", "visitsCount"
          ) VALUES (
            ${name}, ${address}, ${phone}, ${email}, ${description}, ${googleMapsUrl},
            ${communeId}, ${userId}, ${locationQuery},
            false, true, 0, 0
          )
          RETURNING id
        `;

        const vetId = vetResult[0].id;

        const servicesData = serviceIds.map((serviceId) => ({
          vetId: vetId,
          serviceId: serviceId,
        }));

        await tx.vetService.createMany({
          data: servicesData,
        });

        const openingTimesData = openingTimes.map((time) => ({
          vetId: vetId,
          dayOfWeekId: time.dayOfWeekId,
          startTime: time.startTime,
          endTime: time.endTime,
        }));

        await tx.vetOpeningTime.createMany({
          data: openingTimesData,
        });

        return vetId;
      });

      const newVet = await this.prisma.vet.findUnique({
        where: { id: newVetId },
        include: {
          commune: true,
          vetServices: { include: { service: true } },
          vetOpeningTimes: { include: { dayOfWeek: true } },
        },
      });

      return newVet;
    } catch (error) {
      console.error('Error al crear la veterinaria:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          throw new InternalServerErrorException(
            'Error de FK: La comuna, servicio o día de la semana no existen.',
          );
        }
      }
      throw new InternalServerErrorException(
        'Error al registrar la veterinaria.',
      );
    }
  }

  /**
   * Actualiza el perfil de una veterinaria.
   * Solo el dueño (VET_OWNER) puede hacerlo.
   */
  async updateVet(userId: number, vetId: number, dto: UpdateVetDto) {
    const vet = await this.prisma.vet.findUnique({
      where: { id: vetId },
    });
    if (!vet) {
      throw new NotFoundException(`Veterinaria con ID ${vetId} no encontrada.`);
    }
    if (vet.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta veterinaria.',
      );
    }

    const { latitude, longitude, communeId, ...primitiveData } = dto;

    try {
      if (Object.keys(primitiveData).length > 0) {
        await this.prisma.vet.update({
          where: { id: vetId },
          data: primitiveData,
        });
      }

      if (communeId) {
        await this.prisma.vet.update({
          where: { id: vetId },
          data: {
            commune: { connect: { id: communeId } },
          },
        });
      }

      if (latitude && longitude) {
        const locationQuery = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;

        await this.prisma.$queryRaw`
          UPDATE "Vet"
          SET "location" = ${locationQuery}
          WHERE "id" = ${vetId}
        `;
      }

      return this.prisma.vet.findUnique({
        where: { id: vetId },
        include: {
          commune: true,
          vetServices: { include: { service: true } },
          vetOpeningTimes: { include: { dayOfWeek: true } },
        },
      });
    } catch (error) {
      console.error('Error al actualizar la veterinaria:', error);
      throw new InternalServerErrorException(
        'Error al actualizar la veterinaria.',
      );
    }
  }

  /**
   * Desactiva una veterinaria.
   * Solo el dueño (VET_OWNER) puede hacerlo.
   */
  async removeVet(userId: number, vetId: number) {
    const vet = await this.prisma.vet.findUnique({
      where: { id: vetId },
    });
    if (!vet) {
      throw new NotFoundException(`Veterinaria con ID ${vetId} no encontrada.`);
    }
    if (vet.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta veterinaria.',
      );
    }

    try {
      await this.prisma.vet.update({
        where: { id: vetId },
        data: {
          isActive: false,
        },
      });
    } catch (_error) {
      throw new InternalServerErrorException(
        'Error al desactivar la veterinaria.',
      );
    }

    return;
  }

  /**
   * Añade nuevas fotos a una veterinaria, respetando el límite.
   * Solo el dueño puede hacerlo.
   */
  async addPhotos(userId: number, vetId: number, fileUrls: string[]) {
    const vet = await this.prisma.vet.findFirst({
      where: { id: vetId, isActive: true },
    });

    if (!vet) {
      throw new NotFoundException(
        `Veterinaria activa con ID ${vetId} no encontrada.`,
      );
    }
    if (vet.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta veterinaria.',
      );
    }

    const currentActivePhotoCount = await this.prisma.vetImage.count({
      where: { vetId: vetId },
    });

    if (currentActivePhotoCount + fileUrls.length > this.MAX_PHOTOS_PER_VET) {
      throw new BadRequestException(
        `No puedes subir ${fileUrls.length} fotos. Ya tienes ${currentActivePhotoCount} y el límite es ${this.MAX_PHOTOS_PER_VET}.`,
      );
    }

    const lastOrder = await this.prisma.vetImage.aggregate({
      _max: { order: true },
      where: { vetId: vetId },
    });
    const nextOrder = (lastOrder._max.order ?? -1) + 1;

    const logoExists = await this.prisma.vetImage.findFirst({
      where: {
        vetId: vetId,
        isLogo: true,
      },
    });

    const imagesData = fileUrls.map((url, index) => ({
      vetId: vetId,
      imageUrl: url,
      order: nextOrder + index,
      isLogo: !logoExists && index === 0,
    }));

    try {
      await this.prisma.vetImage.createMany({
        data: imagesData,
      });
      return { message: `${fileUrls.length} fotos añadidas.` };
    } catch (_error) {
      throw new InternalServerErrorException('Error al guardar las fotos.');
    }
  }

  /**
   * Elimina una foto de una veterinaria.
   * Si la foto era el logo, reasigna el logo a la siguiente foto.
   * Solo el dueño puede hacerlo.
   */
  async removePhoto(userId: number, vetId: number, photoId: number) {
    const vetImage = await this.prisma.vetImage.findFirst({
      where: {
        id: photoId,
        vetId: vetId,
      },
      include: {
        vet: true,
      },
    });

    if (!vetImage) {
      throw new NotFoundException(
        `Foto con ID ${photoId} no encontrada para la veterinaria ${vetId}.`,
      );
    }

    if (vetImage.vet.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta veterinaria.',
      );
    }

    const oldImageUrl = vetImage.imageUrl;
    const wasLogo = vetImage.isLogo;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.vetImage.delete({
          where: { id: photoId },
        });
        if (wasLogo) {
          const newLogo = await tx.vetImage.findFirst({
            where: { vetId: vetId },
            orderBy: { order: 'asc' },
          });

          if (newLogo) {
            await tx.vetImage.update({
              where: { id: newLogo.id },
              data: { isLogo: true },
            });
          }
        }
      });

      if (oldImageUrl) {
        const oldFileName = oldImageUrl.split('/').pop();
        if (oldFileName) {
          const oldPath = join(PUBLIC_ROOT, 'uploads/vets', oldFileName);
          await unlink(oldPath);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error al eliminar la foto:', error.message);
      }
      throw new InternalServerErrorException('Error al eliminar la foto.');
    }

    return; // 204 No Content
  }

  /**
   * Reordena las fotos de una veterinaria y asigna el nuevo logo.
   * Solo el dueño puede hacerlo.
   */
  async reorderPhotos(
    userId: number,
    vetId: number,
    photoIdsInOrder: number[],
  ) {
    const vet = await this.prisma.vet.findFirst({
      where: { id: vetId, isActive: true },
      include: {
        images: {
          select: { id: true },
        },
      },
    });

    if (!vet) {
      throw new NotFoundException(
        `Veterinaria activa con ID ${vetId} no encontrada.`,
      );
    }
    if (vet.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta veterinaria.',
      );
    }

    const currentPhotoIds = new Set(vet.images.map((img) => img.id));
    const inputPhotoIds = new Set(photoIdsInOrder);

    if (currentPhotoIds.size !== inputPhotoIds.size) {
      throw new BadRequestException(
        `La cantidad de IDs (${inputPhotoIds.size}) no coincide con las fotos activas (${currentPhotoIds.size}).`,
      );
    }

    for (const id of inputPhotoIds) {
      if (!currentPhotoIds.has(id)) {
        throw new BadRequestException(
          `El ID de foto ${id} no pertenece a esta veterinaria.`,
        );
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.vetImage.updateMany({
          where: { vetId: vetId },
          data: { isLogo: false },
        });

        const updatePromises = photoIdsInOrder.map((photoId, index) =>
          tx.vetImage.update({
            where: { id: photoId },
            data: {
              order: index,
              isLogo: index === 0,
            },
          }),
        );
        await Promise.all(updatePromises);
      });

      return this.prisma.vetImage.findMany({
        where: { vetId: vetId },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      console.error('Error al reordenar las fotos:', error);
      throw new InternalServerErrorException('Error al reordenar las fotos.');
    }
  }

  /**
   * Reemplaza todos los servicios de una veterinaria.
   * Solo el dueño puede hacerlo.
   */
  async updateVetServices(userId: number, vetId: number, serviceIds: number[]) {
    await this.checkVetOwnership(userId, vetId);

    const servicesData = serviceIds.map((serviceId) => ({
      vetId: vetId,
      serviceId: serviceId,
    }));

    try {
      await this.prisma.$transaction([
        this.prisma.vetService.deleteMany({
          where: { vetId: vetId },
        }),
        this.prisma.vetService.createMany({
          data: servicesData,
        }),
      ]);

      return { message: 'Servicios actualizados correctamente.' };
    } catch (error) {
      console.error('Error al actualizar servicios:', error);
      throw new InternalServerErrorException('Error al actualizar servicios.');
    }
  }

  /**
   * Reemplaza todos los horarios de una veterinaria.
   * Solo el dueño puede hacerlo.
   */
  async updateVetHours(
    userId: number,
    vetId: number,
    openingTimes: CreateOpeningTimeDto[],
  ) {
    await this.checkVetOwnership(userId, vetId);

    const openingTimesData = openingTimes.map((time) => ({
      vetId: vetId,
      dayOfWeekId: time.dayOfWeekId,
      startTime: time.startTime,
      endTime: time.endTime,
    }));

    try {
      await this.prisma.$transaction([
        this.prisma.vetOpeningTime.deleteMany({
          where: { vetId: vetId },
        }),
        this.prisma.vetOpeningTime.createMany({
          data: openingTimesData,
        }),
      ]);

      return { message: 'Horarios actualizados correctamente.' };
    } catch (error) {
      console.error('Error al actualizar horarios:', error);
      throw new InternalServerErrorException('Error al actualizar horarios.');
    }
  }
}
