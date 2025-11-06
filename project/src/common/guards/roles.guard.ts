import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

type AuthenticatedUser = {
  id: number;
  email: string;
  roles: Role[];
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();

    const hasPermission = requiredRoles.some((role) =>
      user.roles?.includes(role),
    );

    if (hasPermission) {
      return true;
    }

    throw new ForbiddenException(
      'No tienes el rol necesario para acceder a este recurso.',
    );
  }
}
