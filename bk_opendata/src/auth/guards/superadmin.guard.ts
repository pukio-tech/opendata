import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SUPERADMIN_ROLE } from '../access';

/** Solo superadministradores (rol ADMIN). Usar después de JwtAuthGuard. */
@Injectable()
export class SuperadminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as { role?: string } | undefined;
    if (user?.role === SUPERADMIN_ROLE) return true;
    throw new ForbiddenException('Solo un administrador puede realizar esta acción.');
  }
}
