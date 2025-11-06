import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CreateReportDto } from './dto/create-report.dto';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Endpoint protegido (ADMIN) para obtener todos los reportes.
   * GET /api/v1/reports?page=1&limit=10
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  findAllReports(@Query() paginationQuery: PaginationQueryDto) {
    return this.reportsService.findAllReports(paginationQuery);
  }

  /**
   * Endpoint protegido para crear un reporte.
   * POST /api/v1/reports
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  createReport(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateReportDto,
  ) {
    const reporterId = req.user.id;
    return this.reportsService.createReport(reporterId, createDto);
  }

  /**
   * Endpoint protegido (ADMIN) para marcar un reporte como resuelto.
   * PATCH /api/v1/reports/:id/resolve
   */
  @Patch(':id/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  resolveReport(@Param('id', ParseIntPipe) reportId: number) {
    return this.reportsService.resolveReport(reportId);
  }
}
