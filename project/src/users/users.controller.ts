import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';

type AuthenticatedUser = Omit<User, 'password'>;
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  /**
   * GET /users/me
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.id);
  }

  /**
   * GET /users/me/pets
   * Obtener mascotas del usuario
   */
  @Get('me/pets')
  @UseGuards(AuthGuard('jwt'))
  getMyPets(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMyPets(req.user.id);
  }
}
