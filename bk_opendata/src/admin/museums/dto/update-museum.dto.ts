import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsIn,
  IsUrl,
  Matches,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmptyToNull } from '../../shared/location.helper';
import { MUSEUM_STATUSES } from './create-museum.dto';

export class UpdateMuseumDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'El nombre del museo no puede estar vacío' })
  @MaxLength(300)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  museumType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  administration?: string;

  @IsIn(MUSEUM_STATUSES, { message: 'El estado debe ser "Abierto" o "Cerrado"' })
  @IsOptional()
  status?: string;

  @EmptyToNull()
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Debes seleccionar un distrito válido (ubigeo de 6 dígitos)' })
  ubigeo?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber({}, { message: 'La latitud debe ser un número válido' })
  @IsOptional()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsNumber({}, { message: 'La longitud debe ser un número válido' })
  @IsOptional()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsString()
  @IsOptional()
  openingHours?: string;

  @IsString()
  @IsOptional()
  feesDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  phone?: string;

  @EmptyToNull()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'La web debe ser una URL válida' })
  @IsOptional()
  websiteUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'El recorrido virtual debe ser una URL válida' })
  @IsOptional()
  virtualTourUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'La colección virtual debe ser una URL válida' })
  @IsOptional()
  virtualCollectionUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'Facebook debe ser una URL válida' })
  @IsOptional()
  facebookUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'Instagram debe ser una URL válida' })
  @IsOptional()
  instagramUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'Twitter debe ser una URL válida' })
  @IsOptional()
  twitterUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'YouTube debe ser una URL válida' })
  @IsOptional()
  youtubeUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'TikTok debe ser una URL válida' })
  @IsOptional()
  tiktokUrl?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'La imagen de portada debe ser una URL válida' })
  @IsOptional()
  coverImage?: string;

  @EmptyToNull()
  @IsUrl({}, { message: 'La imagen de tarjeta debe ser una URL válida' })
  @IsOptional()
  cardImage?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
