import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role as RoleEnum } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

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

  /**
   * Endpoint para eliminar la cuenta del usuario logueado.
   * DELETE /api/v1/users/me
   */
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Req() req: AuthenticatedRequest) {
    await this.usersService.deleteAccount(req.user.id);
  }

  /**
   * Endpoint ADMINISTRATIVO para borrar CUALQUIER usuario.
   * DELETE /api/v1/users/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserByAdmin(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.deleteAccount(userId);
  }
}
