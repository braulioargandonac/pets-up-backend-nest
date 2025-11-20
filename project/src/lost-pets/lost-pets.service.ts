import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportLostPetDto } from './dto/report-lost-pet.dto';
import { CreateSightingDto } from './dto/create-sighting.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Prisma } from '@prisma/client';

export interface FindLostPetsQueryDto {
  lat?: number;
  lon?: number;
  radiusKm?: number;
}

export interface NearbyLostPetResult {
  id: number;
  petId: number;
  reportedById: number;
  communeId: number;
  lostAt: Date;
  description: string | null;
  isResolved: boolean;
  longitude: number;
  latitude: number;
  distanceInMeters: number;
  petName: string;
  petSpecieId: number;
  petImage: string | null;
}

type LostPetRaw = {
  id: number;
  petId: number;
  reportedById: number;
  communeId: number;
  lostAt: Date;
  description: string | null;
  isResolved: boolean;
  latitude: number;
  longitude: number;
};

@Injectable()
export class LostPetsService {
  constructor(private prisma: PrismaService) {}

  private async getStatusIdByName(name: string): Promise<number> {
    const status = await this.prisma.petStatus.findUnique({
      where: { name },
    });
    if (!status) {
      throw new InternalServerErrorException(
        `El estado '${name}' no existe en la base de datos. Correr seeds.`,
      );
    }
    return status.id;
  }

  async reportLostPet(petId: number, userId: number, dto: ReportLostPetDto) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });

    if (!pet) throw new NotFoundException(`Mascota ${petId} no encontrada`);
    if (pet.ownerId !== userId)
      throw new UnauthorizedException('No autorizado');

    const existingReport = await this.prisma.lostPet.findFirst({
      where: { petId, isResolved: false },
    });

    if (existingReport)
      throw new ConflictException('Ya reportada como perdida');

    const lostStatusId = await this.getStatusIdByName('Perdido');

    const location = Prisma.sql`ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)`;

    try {
      const result = await this.prisma.$queryRaw<[{ id: number }]>`
        INSERT INTO "LostPet" (
          "petId", "reportedById", "communeId", "location",
          "lostAt", "description", "isResolved", "createdAt"
        ) VALUES (
          ${petId}, ${userId}, ${dto.communeId}, ${location},
          ${dto.lostAt}, ${dto.description}, false, NOW()
        )
        RETURNING id
      `;
      const newId = result[0].id;

      await this.prisma.pet.update({
        where: { id: petId },
        data: { statusId: lostStatusId },
      });

      return { id: newId, message: 'Reporte creado exitosamente' };
    } catch (error) {
      console.error('Error reportLostPet:', error);
      throw new InternalServerErrorException('Error al crear reporte');
    }
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [lostPets, total] = await this.prisma.$transaction([
      this.prisma.lostPet.findMany({
        skip,
        take: limit,
        where: { isResolved: false, pet: { isActive: true } },
        include: {
          commune: true,
          pet: {
            include: {
              images: { take: 1, orderBy: { order: 'asc' } },
            },
          },
        },
        orderBy: { lostAt: 'desc' },
      }),
      this.prisma.lostPet.count({
        where: { isResolved: false, pet: { isActive: true } },
      }),
    ]);

    return {
      data: lostPets,
      meta: {
        totalItems: total,
        itemCount: lostPets.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number) {
    const result = await this.prisma.$queryRaw<LostPetRaw[]>`
      SELECT 
        id, "petId", "reportedById", "communeId", "lostAt", "description", "isResolved",
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude
      FROM "LostPet"
      WHERE id = ${id}
    `;

    if (!result.length) throw new NotFoundException('No encontrado');
    const lostPetRaw = result[0];

    const petDetails = await this.prisma.pet.findUnique({
      where: { id: lostPetRaw.petId },
      include: {
        images: { orderBy: { order: 'asc' } },
        specie: true,
        owner: { select: { id: true, name: true, phone: true } },
      },
    });
    const commune = await this.prisma.commune.findUnique({
      where: { id: lostPetRaw.communeId },
    });

    return { ...lostPetRaw, pet: petDetails, commune };
  }

  async reportSighting(
    lostPetId: number,
    sightedById: number,
    dto: CreateSightingDto,
    imageUrl: string,
  ) {
    const lostPet = await this.prisma.lostPet.findUnique({
      where: { id: lostPetId },
    });
    if (!lostPet || lostPet.isResolved) {
      throw new NotFoundException('Reporte no encontrado o resuelto');
    }

    const location = Prisma.sql`ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)`;

    try {
      const result = await this.prisma.$queryRaw<[{ id: number }]>`
        INSERT INTO "LostPetSighting" (
          "lostPetId", "sightedById", "description", "location",
          "imageUrl", "sightingDate"
        ) VALUES (
          ${lostPetId}, ${sightedById}, ${dto.description}, ${location},
          ${imageUrl}, NOW()
        )
        RETURNING id
      `;
      return { id: result[0].id, message: 'Avistamiento reportado' };
    } catch (error) {
      console.error('Error reportSighting:', error);
      throw new InternalServerErrorException('Error al reportar avistamiento');
    }
  }

  async markAsFound(lostPetId: number, userId: number) {
    const result = await this.prisma.$queryRaw<LostPetRaw[]>`
      SELECT "reportedById", "petId", "isResolved" FROM "LostPet" WHERE id = ${lostPetId}
    `;

    if (!result.length) throw new NotFoundException('No encontrado');
    const lostPet = result[0];

    if (lostPet.reportedById !== userId)
      throw new UnauthorizedException('No autorizado');
    if (lostPet.isResolved) throw new ConflictException('Ya resuelto');

    const adoptedStatusId = await this.getStatusIdByName('Adoptado');

    await this.prisma.lostPet.updateMany({
      where: { id: lostPetId },
      data: { isResolved: true, foundAt: new Date() },
    });

    await this.prisma.pet.update({
      where: { id: lostPet.petId },
      data: { statusId: adoptedStatusId },
    });

    return { message: 'Marcado como encontrado' };
  }

  async findNearby(query: FindLostPetsQueryDto) {
    const { lat, lon, radiusKm = 20 } = query;

    if (!lat || !lon) return [];

    const userLocation = Prisma.sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`;
    const radiusMeters = radiusKm * 1000;

    try {
      const lostPets = await this.prisma.$queryRaw<NearbyLostPetResult[]>`
        SELECT 
          lp.id, lp."petId", lp."reportedById", lp."communeId", 
          lp."lostAt", lp."description", lp."isResolved",
          ST_X(lp.location::geometry) as longitude,
          ST_Y(lp.location::geometry) as latitude,
          ST_Distance(lp.location, ${userLocation}) as "distanceInMeters",          
          p.name as "petName",
          p."specieId" as "petSpecieId",
          (
            SELECT "imageUrl" 
            FROM "PetImage" 
            WHERE "petId" = p.id 
            ORDER BY "order" ASC 
            LIMIT 1
          ) as "petImage"

        FROM "LostPet" lp
        JOIN "Pet" p ON lp."petId" = p.id
        WHERE 
          lp."isResolved" = false
          AND ST_DWithin(lp.location, ${userLocation}, ${radiusMeters})
        ORDER BY "distanceInMeters" ASC
        LIMIT 50
      `;

      return lostPets;
    } catch (error) {
      console.error('Error findNearby:', error);
      throw new InternalServerErrorException(
        'Error al buscar mascotas perdidas',
      );
    }
  }
}
