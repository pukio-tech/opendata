import { PrismaService } from '../prisma/prisma.service';

/** Rol con acceso total al panel (todas las apps + gestión de usuarios). */
export const SUPERADMIN_ROLE = 'ADMIN';

/**
 * Apps del panel a las que el usuario tiene acceso.
 * Los ADMIN acceden a todas las apps activas; el resto, solo a las asignadas.
 */
export async function appsDelUsuario(
  prisma: PrismaService,
  user: { id: string; role: string },
): Promise<string[]> {
  if (user.role === SUPERADMIN_ROLE) {
    const apps = await prisma.panelApp.findMany({
      where: { active: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return apps.map((a) => a.id);
  }
  const asignadas = await prisma.userApp.findMany({
    where: { userId: user.id, app: { active: true } },
    select: { appId: true },
    orderBy: { createdAt: 'asc' },
  });
  return asignadas.map((a) => a.appId);
}
