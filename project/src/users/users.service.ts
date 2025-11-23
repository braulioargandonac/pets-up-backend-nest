import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';

const _userWithRolesInclude = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    userRoles: {
      include: {
        role: true,
      },
    },
  },
});

export type UserWithRoles = Prisma.UserGetPayload<typeof _userWithRolesInclude>;
export type PublicUserWithRoles = Omit<UserWithRoles, 'password'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateUserDto,
    roleId: number,
  ): Promise<PublicUserWithRoles | null> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltOrRounds);

    const userData = {
      ...data,
      password: hashedPassword,
    };

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: userData });
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleId,
        },
      });

      return user;
    });

    return this.findById(newUser.id);
  }

  async findByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findById(id: number): Promise<PublicUserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Obtiene todas las mascotas de un usuario.
   */
  async getMyPets(userId: number) {
    return this.prisma.pet.findMany({
      where: {
        ownerId: userId,
        isActive: true,
      },
      include: {
        images: {
          take: 1,
          orderBy: { order: 'asc' },
          where: { isActive: true },
        },
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteAccount(userId: number) {
    const SYSTEM_USER_ID = 1;

    if (userId === SYSTEM_USER_ID) {
      throw new ForbiddenException(
        'No se puede eliminar al usuario Sistema/Admin principal.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // --- 1. INTERACCIONES SOCIALES ---
        await tx.communityPetPostLike.deleteMany({ where: { userId } });
        await tx.communityPetComment.deleteMany({
          where: { authorId: userId },
        });
        await tx.communityPetPost.deleteMany({ where: { authorId: userId } });

        // --- 2. TRANSFERENCIA DE CUIDADO COMUNITARIO ---
        await tx.communityPet.updateMany({
          where: { createdById: userId },
          data: { createdById: SYSTEM_USER_ID },
        });
        await tx.communityPetImage.updateMany({
          where: { uploadedById: userId },
          data: { uploadedById: SYSTEM_USER_ID },
        });
        await tx.communityPetLog.updateMany({
          where: { authorId: userId },
          data: { authorId: SYSTEM_USER_ID },
        });
        await tx.communityPetTask.deleteMany({
          where: { authorId: userId },
        });
        await tx.communityPetTask.updateMany({
          where: { assigneeId: userId },
          data: { assigneeId: null },
        });

        // --- 3. REPORTES Y AVISTAMIENTOS ---
        await tx.report.deleteMany({ where: { reporterId: userId } });
        await tx.report.deleteMany({ where: { reportedUserId: userId } });
        await tx.lostPetSighting.deleteMany({ where: { sightedById: userId } });

        // --- 4. DATOS DE PERFIL ---
        await tx.userImage.deleteMany({ where: { userId } });
        await tx.userReward.deleteMany({ where: { userId } });

        // --- 5. MASCOTAS PERSONALES ---
        const myPets = await tx.pet.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });
        const myPetIds = myPets.map((p) => p.id);

        if (myPetIds.length > 0) {
          await tx.lostPetSighting.deleteMany({
            where: { lostPet: { petId: { in: myPetIds } } },
          });
          await tx.lostPet.deleteMany({ where: { petId: { in: myPetIds } } });
          await tx.petReward.deleteMany({ where: { petId: { in: myPetIds } } });
          await tx.report.deleteMany({
            where: { reportedPetId: { in: myPetIds } },
          });
          await tx.petImage.deleteMany({ where: { petId: { in: myPetIds } } });
          await tx.pet.deleteMany({ where: { ownerId: userId } });
        }

        // --- 6. VETERINARIAS ---
        const myVets = await tx.vet.findMany({ where: { userId } });
        const myVetIds = myVets.map((v) => v.id);
        if (myVetIds.length > 0) {
          await tx.vetImage.deleteMany({ where: { vetId: { in: myVetIds } } });
          await tx.vetOpeningTime.deleteMany({
            where: { vetId: { in: myVetIds } },
          });
          await tx.vetService.deleteMany({
            where: { vetId: { in: myVetIds } },
          });
          await tx.vet.deleteMany({ where: { userId } });
        }

        // --- 7. ROLES ---
        await tx.userRole.deleteMany({ where: { userId } });

        // --- 8. USUARIO FINAL ---
        await tx.user.delete({ where: { id: userId } });
      });

      return {
        message:
          'Cuenta eliminada. Tus aportes comunitarios han sido anonimizados.',
      };
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      throw new InternalServerErrorException('No se pudo eliminar la cuenta.');
    }
  }
}
