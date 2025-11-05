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
import { CommunityPetTasksService } from './community-pet-tasks.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('community-pets/:communityPetId/tasks')
export class CommunityPetTasksController {
  constructor(private readonly tasksService: CommunityPetTasksService) {}

  /**
   * Endpoint protegido para crear una nueva tarea.
   * POST /api/v1/community-pets/:id/tasks
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  createTask(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Body() createDto: CreateTaskDto,
  ) {
    const authorId = req.user.id;
    return this.tasksService.createTask(authorId, communityPetId, createDto);
  }

  /**
   * Endpoint público para obtener las tareas (paginadas).
   * GET /api/v1/community-pets/:id/tasks
   */
  @Get()
  findAllForPet(
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.tasksService.findAllForPet(communityPetId, paginationQuery);
  }

  /**
   * Endpoint protegido para actualizar una tarea.
   * PATCH /api/v1/community-pets/:communityPetId/tasks/:taskId
   */
  @Patch(':taskId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  updateTask(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() updateDto: UpdateTaskDto,
  ) {
    const userId = req.user.id;
    return this.tasksService.updateTask(
      userId,
      communityPetId,
      taskId,
      updateDto,
    );
  }

  /**
   * Endpoint protegido para eliminar una tarea.
   * DELETE /api/v1/community-pets/:communityPetId/tasks/:taskId
   */
  @Delete(':taskId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTask(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    const userId = req.user.id;
    return this.tasksService.removeTask(userId, communityPetId, taskId);
  }

  /**
   * Endpoint protegido para asignarse una tarea.
   * PATCH /api/v1/community-pets/:communityPetId/tasks/:taskId/assign
   */
  @Patch(':taskId/assign')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  assignTask(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    const userId = req.user.id;
    return this.tasksService.assignTask(userId, communityPetId, taskId);
  }

  /**
   * Endpoint protegido para completar una tarea.
   * PATCH /api/v1/community-pets/:communityPetId/tasks/:taskId/complete
   */
  @Patch(':taskId/complete')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  completeTask(
    @Req() req: AuthenticatedRequest,
    @Param('communityPetId', ParseIntPipe) communityPetId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    const userId = req.user.id;
    return this.tasksService.completeTask(userId, communityPetId, taskId);
  }
}
