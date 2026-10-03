import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperadminGuard } from '../../auth/guards/superadmin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

/** Usuarios del panel y sus accesos por app. Solo superadministradores (ADMIN). */
@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /** Catálogo de apps del panel (para asignar accesos). */
  @Get('apps')
  apps() {
    return this.usersService.apps();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto, @CurrentUser('email') adminEmail: string) {
    return this.usersService.create(dto, adminEmail);
  }

  /** Datos, rol, estado, apps asignadas o restablecer contraseña. */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() admin: { id: string; email: string },
  ) {
    return this.usersService.update(id, dto, admin);
  }
}
