import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUPERADMIN_ROLE } from '../access';

const APP_KEY = 'panel:app';

/** Exige acceso a una app del panel. Usar junto a JwtAuthGuard: `@UseGuards(JwtAuthGuard, AppAccessGuard)`. */
export const RequireApp = (appId: string) => SetMetadata(APP_KEY, appId);

@Injectable()
export class AppAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const appId = this.reflector.getAllAndOverride<string | undefined>(APP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!appId) return true;
    const user = context.switchToHttp().getRequest().user as { role?: string; apps?: string[] } | undefined;
    if (user?.role === SUPERADMIN_ROLE || user?.apps?.includes(appId)) return true;
    throw new ForbiddenException('No tienes acceso a esta aplicación.');
  }
}
