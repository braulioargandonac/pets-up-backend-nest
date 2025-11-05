import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { CommunityPetLogsService } from './community-pet-logs.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CreateLogDto } from './dto/create-log.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UpdateLogDto } from './dto/update-log.dto';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('community-pets/:communityPetId/logs')
export class CommunityPetLogsController {
  constructor(private readonly logsService: CommunityPetLogsService) {}

  /**
   * Endpoint protegido para crear una nueva entrada en la bitácora.
   * POST /api/v1/community-pets/:id/logs
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  createLog(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Body() createDto: CreateLogDto,
  ) {
    const authorId = req.user.id;
    return this.logsService.createLog(authorId, communityPetId, createDto);
  }

  /**
   * Endpoint público para obtener la bitácora (paginada).
   * GET /api/v1/community-pets/:id/logs
   */
  @Get()
  findAllForPet(
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.logsService.findAllForPet(communityPetId, paginationQuery);
  }

  /**
   * Endpoint protegido para actualizar una entrada de la bitácora.
   * PATCH /api/v1/community-pets/:communityPetId/logs/:logId
   */
  @Patch(':logId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  updateLog(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Param('logId', ParseIntPipe) logId: number,
    @Body() updateDto: UpdateLogDto,
  ) {
    const userId = req.user.id;
    return this.logsService.updateLog(userId, communityPetId, logId, updateDto);
  }

  /**
   * Endpoint protegido para eliminar una entrada de la bitácora.
   * DELETE /api/v1/community-pets/:communityPetId/logs/:logId
   */
  @Delete(':logId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLog(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Param('logId', ParseIntPipe) logId: number,
  ) {
    const userId = req.user.id;
    return this.logsService.removeLog(userId, communityPetId, logId);
  }
}
