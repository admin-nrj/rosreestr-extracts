import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '@rosreestr-extracts/interfaces';
import { UserRole } from '@rosreestr-extracts/entities';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest<{ user: User }>();
    return requiredRoles.some((role) => (user.role as UserRole) === role);
  }
}
