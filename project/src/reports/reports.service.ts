import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo reporte.
   */
  async createReport(reporterId: number, dto: CreateReportDto) {
    if (dto.reportedUserId && dto.reportedUserId === reporterId) {
      throw new BadRequestException('No puedes reportarte a ti mismo.');
    }

    const reportTypeExists = await this.prisma.reportType.findUnique({
      where: { id: dto.typeId },
    });
    if (!reportTypeExists) {
      throw new BadRequestException('El tipo de reporte no es válido.');
    }

    try {
      const newReport = await this.prisma.report.create({
        data: {
          reporterId: reporterId,
          typeId: dto.typeId,
          description: dto.description,
          isResolved: false,

          reportedPetId: dto.reportedPetId,
          reportedCommunityPetId: dto.reportedCommunityPetId,
          reportedPostId: dto.reportedPostId,
          reportedCommentId: dto.reportedCommentId,
          reportedUserId: dto.reportedUserId,
        },
      });
      return newReport;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          throw new BadRequestException(
            'El ítem que intentas reportar no existe.',
          );
        }
      }
      throw new InternalServerErrorException('Error al crear el reporte.');
    }
  }

  /**
   * Devuelve una lista paginada de todos los reportes.
   * (Solo para Admins)
   */
  async findAllReports(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        skip: skip,
        take: limit,
        where: {
          isResolved: false,
        },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          type: true,
          reportedPet: true,
          reportedCommunityPet: true,
          reportedPost: true,
          reportedComment: true,
          reportedUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.report.count({
        where: { isResolved: false },
      }),
    ]);

    return {
      data: reports,
      meta: {
        totalItems: total,
        itemCount: reports.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Marca un reporte como "resuelto".
   * (Solo para Admins)
   */
  async resolveReport(reportId: number) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException(`Reporte con ID ${reportId} no encontrado.`);
    }

    if (report.isResolved) {
      return report;
    }

    try {
      return await this.prisma.report.update({
        where: { id: reportId },
        data: { isResolved: true },
      });
    } catch (_error) {
      throw new InternalServerErrorException('Error al resolver el reporte.');
    }
  }
}
