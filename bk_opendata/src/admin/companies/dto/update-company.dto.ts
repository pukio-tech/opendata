import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUrl,
  IsDateString,
  Matches,
  MaxLength,
} from 'class-validator';
import { EmptyToNull } from '../../shared/location.helper';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'El RUC debe tener exactamente 11 dígitos' })
  ruc?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'La razón social no puede estar vacía' })
  @MaxLength(500)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  tradeName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxpayerStatus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  domicileCondition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  taxpayerType?: string;

  @EmptyToNull()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  ciiuCode?: string;

  @EmptyToNull()
  @IsDateString({}, { message: 'La fecha de inicio de actividades no es válida (YYYY-MM-DD)' })
  @IsOptional()
  activityStartDate?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @EmptyToNull()
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Debes seleccionar un distrito válido (ubigeo de 6 dígitos)' })
  ubigeo?: string;

  @EmptyToNull()
  @IsString()
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'El DNI del representante debe tener 8 dígitos' })
  representativeDni?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  representativeFirstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  representativeLastName1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  representativeLastName2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  phone?: string;

  @EmptyToNull()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'El sitio web debe ser una URL válida' })
  @IsOptional()
  @MaxLength(500)
  website?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
