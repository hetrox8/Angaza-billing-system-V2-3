import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required, access granted
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false; // No user, access denied
    }

    // Check if user has any of the required roles
    const userRole = user.role || (user as any).role;
    
    return requiredRoles.some((role) => userRole === role);
  }
}
