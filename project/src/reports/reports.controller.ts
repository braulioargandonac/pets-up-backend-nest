import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CreateReportDto } from './dto/create-report.dto';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Endpoint protegido para crear un nuevo reporte.
   * POST /api/v1/reports
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createReport(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateReportDto,
  ) {
    const reporterId = req.user.id;
    return this.reportsService.createReport(reporterId, createDto);
  }
}
