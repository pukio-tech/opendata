import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';

export interface LocationRow {
  ubigeo: string;
  district: string;
  province: string;
  department: string;
}

export interface ResolveLocationOptions {
  /**
   * Reutiliza la grafía del departamento ya existente en turismo.recursos
   * (ej. 'ÁNCASH' vs 'ANCASH'). Solo lo usa el módulo de lugares turísticos.
   */
  useRecursosSpelling?: boolean;
}

/** Resuelve departamento/provincia/distrito a partir del ubigeo del distrito. */
export async function resolveLocation(
  prisma: PrismaService,
  ubigeo: string,
  options: ResolveLocationOptions = {},
): Promise<LocationRow> {
  const rows = options.useRecursosSpelling
    ? await prisma.$queryRaw<LocationRow[]>`
        SELECT
          d.ubigeo,
          d.nombre AS district,
          p.nombre AS province,
          -- Reutiliza la grafía existente en recursos (ej. 'ÁNCASH' vs 'ANCASH')
          COALESCE(
            (SELECT r.departamento FROM turismo.recursos r
              WHERE turismo.f_unaccent(lower(r.departamento)) = turismo.f_unaccent(lower(dep.nombre))
              LIMIT 1),
            dep.nombre
          ) AS department
        FROM turismo.distritos d
        JOIN turismo.provincias p ON p.id_provincia = d.id_provincia
        JOIN turismo.departamentos dep ON dep.id_departamento = p.id_departamento
        WHERE d.ubigeo = ${ubigeo}`
    : await prisma.$queryRaw<LocationRow[]>`
        SELECT
          d.ubigeo,
          d.nombre   AS district,
          p.nombre   AS province,
          dep.nombre AS department
        FROM turismo.distritos d
        JOIN turismo.provincias p ON p.id_provincia = d.id_provincia
        JOIN turismo.departamentos dep ON dep.id_departamento = p.id_departamento
        WHERE d.ubigeo = ${ubigeo}`;

  if (!rows.length) {
    throw new BadRequestException(`El ubigeo "${ubigeo}" no existe`);
  }
  return rows[0];
}

/**
 * Convierte '' en null para campos opcionales validados (email, URL, fechas…),
 * de modo que un input vacío del formulario limpie el campo en vez de fallar
 * la validación.
 */
export const EmptyToNull = () =>
  Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value));

/**
 * Booleano de query string ("true"/"false").
 * Lee el valor crudo de `obj[key]`: con `enableImplicitConversion` el `value`
 * ya llega convertido y Boolean("false") === true, lo que rompía los filtros.
 */
export const QueryBoolean = () =>
  Transform(({ obj, key }) => {
    const raw = obj[key];
    if (raw === true || raw === 'true' || raw === '1') return true;
    if (raw === false || raw === 'false' || raw === '0') return false;
    return undefined;
  });
