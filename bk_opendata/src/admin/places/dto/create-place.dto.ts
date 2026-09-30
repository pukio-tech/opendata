import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUrl,
  Length,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Crea un recurso turístico en turismo.recursos (origen = 'manual').
 * La ubicación se define por el ubigeo del distrito; departamento y
 * provincia se derivan de las tablas de ubigeo.
 */
export class CreateTouristPlaceDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del lugar es requerido' })
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt({ message: 'La categoría no es válida' })
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsString()
  @Length(6, 6, { message: 'Debes seleccionar un distrito válido (ubigeo de 6 dígitos)' })
  ubigeo: string;

  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  // Coordenadas
  @IsNumber({}, { message: 'La latitud debe ser un número válido' })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude: number;

  @IsNumber({}, { message: 'La longitud debe ser un número válido' })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude: number;

  // SEO
  @IsString()
  @IsOptional()
  @MaxLength(255)
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  keywords?: string;
}
