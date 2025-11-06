import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PublicUserWithRoles, UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  roles: Role[];
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUserWithRoles;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private _getRoles(user: PublicUserWithRoles): Role[] {
    if (!user.userRoles) return [];
    return user.userRoles.map((userRole) => userRole.role.name as Role);
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<PublicUserWithRoles | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  private _createToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const userRole = await this.prisma.role.findUnique({
      where: { name: Role.USER },
    });
    if (!userRole) {
      throw new InternalServerErrorException(
        "Rol 'user' no encontrado en la BD.",
      );
    }

    const user = await this.usersService.create(createUserDto, userRole.id);

    if (!user) {
      throw new InternalServerErrorException(
        'No se pudo crear el usuario correctamente.',
      );
    }

    const roles = this._getRoles(user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: roles,
    };

    const accessToken = this._createToken(payload);

    return { accessToken, user };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const roles = this._getRoles(user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: roles,
    };

    const accessToken = this._createToken(payload);
    return { accessToken, user };
  }
}
