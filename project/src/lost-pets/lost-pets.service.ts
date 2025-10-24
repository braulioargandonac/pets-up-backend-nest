import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportLostPetDto } from './dto/report-lost-pet.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateSightingDto } from './dto/create-sighting.dto';

@Injectable()
export class LostPetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un reporte de Mascota Perdida.
   * Valida que quien reporta sea el dueño.
   */
  async reportLostPet(petId: number, userId: number, dto: ReportLostPetDto) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    if (pet.ownerId !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para reportar esta mascota',
      );
    }

    const existingReport = await this.prisma.lostPet.findUnique({
      where: { petId },
    });

    if (existingReport && !existingReport.isResolved) {
      throw new ConflictException(
        'Esta mascota ya está reportada como perdida',
      );
    }

    const newLostPetReport = await this.prisma.lostPet.create({
      data: {
        petId: petId,
        reportedById: userId,
        communeId: dto.communeId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        lostAt: dto.lostAt,
        description: dto.description,
        isResolved: false,
      },
    });

    await this.prisma.pet.update({
      where: { id: petId },
      data: { statusId: 3 },
    });

    return newLostPetReport;
  }

  /**
   * Devuelve una lista paginada de mascotas perdidas.
   */
  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [lostPets, total] = await this.prisma.$transaction([
      this.prisma.lostPet.findMany({
        skip: skip,
        take: limit,
        where: {
          isResolved: false,
        },
        include: {
          commune: true,
          pet: {
            include: {
              images: {
                take: 1,
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
        orderBy: {
          lostAt: 'desc',
        },
      }),
      this.prisma.lostPet.count({
        where: { isResolved: false },
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

  /**
   * Devuelve el detalle completo de un reporte de mascota perdida.
   */
  async findOne(id: number) {
    const lostPetReport = await this.prisma.lostPet.findUnique({
      where: {
        id: id,
        isResolved: false,
      },
      include: {
        commune: true,
        pet: {
          include: {
            images: true,
            owner: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            specie: true,
            breed: true,
            size: true,
          },
        },
      },
    });

    if (!lostPetReport) {
      throw new NotFoundException(
        `Reporte de mascota perdida con ID ${id} no encontrado.`,
      );
    }

    return lostPetReport;
  }

  /**
   * Crea un nuevo avistamiento para una mascota perdida.
   */
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
      throw new NotFoundException(
        `Reporte de mascota perdida con ID ${lostPetId} no encontrado o ya resuelto.`,
      );
    }

    const newSighting = await this.prisma.lostPetSighting.create({
      data: {
        lostPetId: lostPetId,
        sightedById: sightedById,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
        imageUrl: imageUrl,
      },
    });

    // TODO: lógica para notificar al dueño.
    // this.notificationsService.notifyOwnerOfSighting(lostPet.reportedById, newSighting);

    return newSighting;
  }

  /**
   * Marca un reporte de mascota perdida como "Resuelto" (Encontrada).
   * Solo el dueño original puede hacer esto.
   */
  async markAsFound(lostPetId: number, userId: number) {
    const lostPet = await this.prisma.lostPet.findUnique({
      where: { id: lostPetId },
    });

    if (!lostPet) {
      throw new NotFoundException(
        `Reporte de mascota perdida con ID ${lostPetId} no encontrado.`,
      );
    }

    if (lostPet.reportedById !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para cerrar este reporte.',
      );
    }

    if (lostPet.isResolved) {
      throw new ConflictException('Este reporte ya ha sido cerrado.');
    }

    const [updatedReport] = await this.prisma.$transaction([
      this.prisma.lostPet.update({
        where: { id: lostPetId },
        data: {
          isResolved: true,
          foundAt: new Date(),
        },
      }),
      this.prisma.pet.update({
        where: { id: lostPet.petId },
        data: { statusId: 2 },
      }),
    ]);

    return updatedReport;
  }
}
