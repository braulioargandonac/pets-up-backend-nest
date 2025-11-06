import { Injectable } from '@nestjs/common';
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
}
