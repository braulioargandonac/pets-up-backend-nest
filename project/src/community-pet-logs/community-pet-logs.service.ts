import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommunityPetLog } from '@prisma/client';
import { UpdateLogDto } from './dto/update-log.dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class CommunityPetLogsService {
  constructor(private prisma: PrismaService) {}

  private async checkLogPermissions(
    userId: number,
    communityPetId: number,
    logId: number,
  ): Promise<CommunityPetLog> {
    const log = await this.prisma.communityPetLog.findUnique({
      where: { id: logId },
      include: {
        // Incluimos la mascota para saber quién es el creador
        communityPet: true,
      },
    });

    if (!log || log.communityPetId !== communityPetId) {
      throw new NotFoundException(
        `Entrada de bitácora con ID ${logId} no encontrada para esta mascota.`,
      );
    }

    const isAuthor = log.authorId === userId;
    const isPetCreator = log.communityPet.createdById === userId;

    if (isAuthor || isPetCreator) {
      return log;
    }

    throw new ForbiddenException(
      'No tienes permiso para modificar esta entrada de bitácora.',
    );
  }

  /**
   * Crea una nueva entrada en la bitácora.
   */
  async createLog(authorId: number, communityPetId: number, dto: CreateLogDto) {
    const pet = await this.prisma.communityPet.findFirst({
      where: { id: communityPetId, isActive: true },
    });
    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${communityPetId} no encontrada.`,
      );
    }

    // 2. Crear la entrada de log
    const newLog = await this.prisma.communityPetLog.create({
      data: {
        communityPetId: communityPetId,
        authorId: authorId,
        content: dto.content,
        logType: dto.logType,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return newLog;
  }

  /**
   * Devuelve una lista paginada de entradas de bitácora.
   */
  async findAllForPet(
    communityPetId: number,
    paginationQuery: PaginationQueryDto,
  ) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const pet = await this.prisma.communityPet.findFirst({
      where: { id: communityPetId, isActive: true },
    });
    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${communityPetId} no encontrada.`,
      );
    }

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.communityPetLog.findMany({
        skip: skip,
        take: limit,
        where: { communityPetId: communityPetId },
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.communityPetLog.count({
        where: { communityPetId: communityPetId },
      }),
    ]);

    return {
      data: logs,
      meta: {
        totalItems: total,
        itemCount: logs.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Actualiza una entrada de la bitácora.
   * Solo el autor o el creador de la mascota pueden hacerlo.
   */
  async updateLog(
    userId: number,
    communityPetId: number,
    logId: number,
    dto: UpdateLogDto,
  ) {
    await this.checkLogPermissions(userId, communityPetId, logId);

    try {
      const updatedLog = await this.prisma.communityPetLog.update({
        where: { id: logId },
        data: {
          content: dto.content,
          logType: dto.logType,
        },
      });
      return updatedLog;
    } catch (_error) {
      throw new InternalServerErrorException('Error al actualizar la entrada.');
    }
  }

  /**
   * Elimina una entrada de la bitácora.
   * Solo el autor o el creador de la mascota pueden hacerlo.
   */
  async removeLog(userId: number, communityPetId: number, logId: number) {
    await this.checkLogPermissions(userId, communityPetId, logId);

    try {
      await this.prisma.communityPetLog.delete({
        where: { id: logId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return;
      }
      throw new InternalServerErrorException('Error al eliminar la entrada.');
    }

    return;
  }
}
