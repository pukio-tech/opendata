import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { SUPERADMIN_ROLE } from '../../auth/access';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const SELECT_USER = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  apps: { select: { appId: true }, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof SELECT_USER }>;

const toDto = ({ apps, ...u }: UserRow) => ({ ...u, apps: apps.map((a) => a.appId) });

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: SELECT_USER,
      orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
    });
    return { success: true, data: users.map(toDto) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SELECT_USER });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { success: true, data: toDto(user) };
  }

  /** Apps del panel con cuántos usuarios (no ADMIN) tienen acceso asignado. */
  async apps() {
    const apps = await this.prisma.panelApp.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { users: true } } },
    });
    return { success: true, data: apps.map(({ _count, ...a }) => ({ ...a, users: _count.users })) };
  }

  /** Valida que las apps existan y estén activas. */
  private async validarApps(apps: string[] | undefined): Promise<string[]> {
    if (!apps?.length) return [];
    const existentes = await this.prisma.panelApp.findMany({
      where: { id: { in: apps }, active: true },
      select: { id: true },
    });
    const validas = new Set(existentes.map((a) => a.id));
    const invalidas = apps.filter((a) => !validas.has(a));
    if (invalidas.length) throw new BadRequestException(`Apps no válidas: ${invalidas.join(', ')}`);
    return apps;
  }

  async create(dto: CreateUserDto, adminEmail: string) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }
    const esAdmin = dto.role === SUPERADMIN_ROLE;
    const apps = esAdmin ? [] : await this.validarApps(dto.apps);
    if (!esAdmin && apps.length === 0) throw new BadRequestException('Asigna al menos una aplicación al usuario.');

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name?.trim() || null,
        password: await bcrypt.hash(dto.password, 10),
        role: dto.role,
        apps: { create: apps.map((appId) => ({ appId, grantedBy: adminEmail })) },
      },
      select: SELECT_USER,
    });
    return { success: true, message: 'Usuario creado correctamente', data: toDto(user) };
  }

  async update(id: string, dto: UpdateUserDto, admin: { id: string; email: string }) {
    const actual = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, active: true } });
    if (!actual) throw new NotFoundException('Usuario no encontrado');

    const esUnoMismo = id === admin.id;
    if (esUnoMismo && dto.active === false) throw new BadRequestException('No puedes desactivar tu propio usuario.');
    if (esUnoMismo && dto.role && dto.role !== SUPERADMIN_ROLE) {
      throw new BadRequestException('No puedes quitarte el rol de administrador.');
    }

    const rolFinal = dto.role ?? actual.role;
    const activoFinal = dto.active ?? actual.active;
    // Siempre debe quedar al menos un administrador activo
    if (actual.role === SUPERADMIN_ROLE && actual.active && (rolFinal !== SUPERADMIN_ROLE || !activoFinal)) {
      const otros = await this.prisma.user.count({ where: { role: SUPERADMIN_ROLE, active: true, id: { not: id } } });
      if (otros === 0) throw new BadRequestException('Debe quedar al menos un administrador activo.');
    }

    // Apps: un ADMIN ve todas (se limpian sus asignaciones); un EDITOR necesita al menos una
    let apps: string[] | undefined;
    if (rolFinal === SUPERADMIN_ROLE) apps = actual.role === SUPERADMIN_ROLE ? undefined : [];
    else if (dto.apps !== undefined) apps = await this.validarApps(dto.apps);
    if (rolFinal !== SUPERADMIN_ROLE) {
      const total = apps !== undefined ? apps.length : await this.prisma.userApp.count({ where: { userId: id } });
      if (total === 0) throw new BadRequestException('Asigna al menos una aplicación al usuario.');
    }

    const password = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const user = await this.prisma.$transaction(async (tx) => {
      if (apps !== undefined) {
        await tx.userApp.deleteMany({ where: { userId: id, appId: { notIn: apps } } });
        await tx.userApp.createMany({
          data: apps.map((appId) => ({ userId: id, appId, grantedBy: admin.email })),
          skipDuplicates: true,
        });
      }
      return tx.user.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name?.trim() || null } : {}),
          ...(dto.role ? { role: dto.role } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          ...(password ? { password } : {}),
        },
        select: SELECT_USER,
      });
    });
    return { success: true, message: 'Usuario actualizado correctamente', data: toDto(user) };
  }
}
