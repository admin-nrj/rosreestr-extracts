import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '@rosreestr-extracts/interfaces';
import { UserRole } from '@rosreestr-extracts/entities';


@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: User; params: { id: string } }>();
    const user = request.user;
    const resourceId = parseInt(request.params.id, 10);

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admin has access to all resources
    if (user.role === UserRole.ADMIN as string) {
      return true;
    }

    // Regular user has access only to their own resources
    if (user.userId === resourceId) {
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}
