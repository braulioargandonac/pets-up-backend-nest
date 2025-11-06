import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Prisma } from '@prisma/client';

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
}
