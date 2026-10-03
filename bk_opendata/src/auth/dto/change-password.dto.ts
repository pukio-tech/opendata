import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Reglas de contraseña del panel: 8+ caracteres con mayúscula, minúscula y número. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE = 'La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula y número';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Ingresa tu contraseña actual' })
  currentPassword: string;

  @IsString()
  @MaxLength(72, { message: 'La contraseña no debe superar 72 caracteres' })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
