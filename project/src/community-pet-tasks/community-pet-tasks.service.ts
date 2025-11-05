import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommunityPetTask } from '@prisma/client';
import { Prisma } from 'generated/prisma';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class CommunityPetTasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper privado para verificar permisos (Autor O Creador de Mascota).
   */
  private async checkTaskPermissions(
    userId: number,
    communityPetId: number,
    taskId: number,
  ): Promise<CommunityPetTask> {
    const task = await this.prisma.communityPetTask.findUnique({
      where: { id: taskId },
      include: {
        communityPet: true,
      },
    });

    if (!task || task.communityPetId !== communityPetId) {
      throw new NotFoundException(
        `Tarea con ID ${taskId} no encontrada para esta mascota.`,
      );
    }

    const isAuthor = task.authorId === userId;
    const isPetCreator = task.communityPet.createdById === userId;

    if (isAuthor || isPetCreator) {
      return task;
    }

    throw new ForbiddenException(
      'No tienes permiso para modificar esta tarea.',
    );
  }

  /**
   * Crea una nueva tarea para una mascota comunitaria.
   */
  async createTask(
    authorId: number,
    communityPetId: number,
    dto: CreateTaskDto,
  ) {
    const pet = await this.prisma.communityPet.findFirst({
      where: { id: communityPetId, isActive: true },
    });
    if (!pet) {
      throw new NotFoundException(
        `Mascota comunitaria con ID ${communityPetId} no encontrada.`,
      );
    }

    const newTask = await this.prisma.communityPetTask.create({
      data: {
        communityPetId: communityPetId,
        authorId: authorId,
        title: dto.title,
        description: dto.description,
        isCompleted: false,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return newTask;
  }

  /**
   * Devuelve una lista paginada de tareas.
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

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.communityPetTask.findMany({
        skip: skip,
        take: limit,
        where: { communityPetId: communityPetId },
        include: {
          author: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.communityPetTask.count({
        where: { communityPetId: communityPetId },
      }),
    ]);

    return {
      data: tasks,
      meta: {
        totalItems: total,
        itemCount: tasks.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Actualiza una tarea.
   * Solo el autor o el creador de la mascota pueden hacerlo.
   */
  async updateTask(
    userId: number,
    communityPetId: number,
    taskId: number,
    dto: UpdateTaskDto,
  ) {
    await this.checkTaskPermissions(userId, communityPetId, taskId);

    try {
      const updatedTask = await this.prisma.communityPetTask.update({
        where: { id: taskId },
        data: {
          title: dto.title,
          description: dto.description,
        },
      });
      return updatedTask;
    } catch (_error) {
      throw new InternalServerErrorException('Error al actualizar la tarea.');
    }
  }

  /**
   * Elimina una tarea.
   * Solo el autor o el creador de la mascota pueden hacerlo.
   */
  async removeTask(userId: number, communityPetId: number, taskId: number) {
    await this.checkTaskPermissions(userId, communityPetId, taskId);

    try {
      await this.prisma.communityPetTask.delete({
        where: { id: taskId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return;
      }
      throw new InternalServerErrorException('Error al eliminar la tarea.');
    }

    return;
  }

  /**
   * Asigna una tarea a un usuario (a sí mismo).
   */
  async assignTask(userId: number, communityPetId: number, taskId: number) {
    const task = await this.prisma.communityPetTask.findFirst({
      where: {
        id: taskId,
        communityPetId: communityPetId,
      },
    });

    if (!task) {
      throw new NotFoundException(
        `Tarea con ID ${taskId} no encontrada para esta mascota.`,
      );
    }

    if (task.isCompleted) {
      throw new ConflictException('Esta tarea ya está completada.');
    }
    if (task.assigneeId) {
      throw new ConflictException(
        'Esta tarea ya está asignada a otro usuario.',
      );
    }

    try {
      return await this.prisma.communityPetTask.update({
        where: { id: taskId },
        data: {
          assigneeId: userId,
        },
      });
    } catch (_error) {
      throw new InternalServerErrorException('Error al asignar la tarea.');
    }
  }

  /**
   * Marca una tarea como completada.
   * Solo el creador, el asignado o el creador de la mascota pueden hacerlo.
   */
  async completeTask(userId: number, communityPetId: number, taskId: number) {
    const task = await this.prisma.communityPetTask.findFirst({
      where: {
        id: taskId,
        communityPetId: communityPetId,
      },
      include: {
        communityPet: true,
      },
    });

    if (!task) {
      throw new NotFoundException(
        `Tarea con ID ${taskId} no encontrada para esta mascota.`,
      );
    }

    const isAuthor = task.authorId === userId;
    const isPetCreator = task.communityPet.createdById === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isAuthor && !isPetCreator && !isAssignee) {
      throw new ForbiddenException(
        'No tienes permiso para completar esta tarea.',
      );
    }

    if (task.isCompleted) {
      throw new ConflictException('Esta tarea ya está completada.');
    }

    try {
      return await this.prisma.communityPetTask.update({
        where: { id: taskId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          assigneeId: task.assigneeId ?? userId,
        },
      });
    } catch (_error) {
      throw new InternalServerErrorException('Error al completar la tarea.');
    }
  }
}
