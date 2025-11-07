import {
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

@Injectable()
export class VetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Devuelve una lista de veterinarias filtrada por proximidad,
   * servicios y horario de atención.
   */
  async findNearby(query: FindVetsQueryDto) {
    const { lat, lon, radiusKm = 5, serviceId, openNow = false } = query;

    const radiusInMeters = radiusKm * 1000;
    const userLocation = Prisma.sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`;

    let openNowJoin = Prisma.empty;
    let openNowWhere = Prisma.empty;

    if (openNow) {
      const today = new Date().getDay();
      const dayOfWeekId = today === 0 ? 7 : today;

      const now = new Date();
      now.setHours(now.getUTCHours() - 3);
      const currentTime = now.toTimeString().substr(0, 5);

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
          "v"."id",
          "v"."name",
          "v"."address",
          "v"."isVerified",
          "v"."googleMapsUrl",
          
          ST_X("v"."location"::geometry) AS "longitude",
          ST_Y("v"."location"::geometry) AS "latitude",
          
          ST_Distance("v"."location", ${userLocation}) AS "distanceInMeters"
          
        FROM "Vet" AS "v"
        
        ${serviceJoin}
        ${openNowJoin}

        WHERE
          ST_DWithin(
            "v"."location",
            ${userLocation},
            ${radiusInMeters}
          )

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
        isVerified: true,
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
            "isVerified", "howToGoCount", "visitsCount"
          ) VALUES (
            ${name}, ${address}, ${phone}, ${email}, ${description}, ${googleMapsUrl},
            ${communeId}, ${userId}, ${locationQuery},
            false, 0, 0
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
}
