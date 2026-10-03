import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../../../auth/dto/change-password.dto';

/** Roles asignables desde el panel. ADMIN = superadmin; EDITOR = solo apps asignadas. */
export const ROLES_PANEL = ['ADMIN', 'EDITOR'] as const;
export type RolPanel = (typeof ROLES_PANEL)[number];

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsString()
  @MaxLength(72, { message: 'La contraseña no debe superar 72 caracteres' })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @IsIn(ROLES_PANEL, { message: 'Rol no válido (ADMIN o EDITOR)' })
  role: RolPanel;

  /** Ids de apps del panel (se ignora para ADMIN, que ve todas). */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  apps?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @IsOptional()
  @IsIn(ROLES_PANEL, { message: 'Rol no válido (ADMIN o EDITOR)' })
  role?: RolPanel;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** Reemplaza la lista completa de apps asignadas. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  apps?: string[];

  /** Restablece la contraseña (el administrador se la comunica al usuario). */
  @IsOptional()
  @IsString()
  @MaxLength(72, { message: 'La contraseña no debe superar 72 caracteres' })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password?: string;
}
