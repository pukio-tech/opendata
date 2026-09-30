import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMuseumDto, MUSEUM_STATUSES } from './dto/create-museum.dto';
import { UpdateMuseumDto } from './dto/update-museum.dto';
import { QueryMuseumDto } from './dto/query-museum.dto';
import { resolveLocation, LocationRow } from '../shared/location.helper';

/**
 * Gestión de museos sobre museos.museos (la misma tabla que alimenta el
 * scraper de museos.cultura.pe y la web pública).
 *
 * - origen = 'importado': registros del scraper. Hace upsert por slug y
 *   sobrescribe prácticamente todas las columnas de contenido; solo
 *   is_active y origen se conservan.
 * - origen = 'manual': creados desde el panel (url_origen = 'panel:manual').
 *
 * geom lo mantiene el trigger trg_museos_geom a partir de latitud/longitud.
 */

/** Campos de texto simples: clave del DTO → columna. */
const TEXT_COLUMNS: [keyof UpdateMuseumDto, string][] = [
  ['category', 'categoria'],
  ['museumType', 'tipo_museo'],
  ['administration', 'administracion'],
  ['address', 'direccion'],
  ['openingHours', 'horario_atencion'],
  ['feesDescription', 'tarifario_descripcion'],
  ['phone', 'telefono'],
  ['email', 'email'],
  ['websiteUrl', 'web_url'],
  ['virtualTourUrl', 'recorrido_virtual_url'],
  ['virtualCollectionUrl', 'coleccion_virtual_url'],
  ['facebookUrl', 'facebook_url'],
  ['instagramUrl', 'instagram_url'],
  ['twitterUrl', 'twitter_url'],
  ['youtubeUrl', 'youtube_url'],
  ['tiktokUrl', 'tiktok_url'],
  ['coverImage', 'imagen_portada'],
  ['cardImage', 'imagen_tarjeta'],
  ['description', 'descripcion'],
];

const SELECT_MUSEUM = Prisma.sql`
  SELECT
    m.id_museo                      AS id,
    m.slug,
    m.nombre                        AS name,
    m.categoria                     AS category,
    m.tipo_museo                    AS "museumType",
    m.administracion                AS administration,
    m.estado                        AS status,
    m.departamento                  AS department,
    m.provincia                     AS province,
    m.distrito                      AS district,
    m.ubigeo,
    m.direccion                     AS address,
    m.latitud::float8               AS latitude,
    m.longitud::float8              AS longitude,
    m.horario_atencion              AS "openingHours",
    m.tarifario_descripcion         AS "feesDescription",
    m.telefono                      AS phone,
    m.email,
    m.web_url                       AS "websiteUrl",
    m.recorrido_virtual_url         AS "virtualTourUrl",
    m.coleccion_virtual_url         AS "virtualCollectionUrl",
    m.facebook_url                  AS "facebookUrl",
    m.instagram_url                 AS "instagramUrl",
    m.twitter_url                   AS "twitterUrl",
    m.youtube_url                   AS "youtubeUrl",
    m.tiktok_url                    AS "tiktokUrl",
    m.imagen_portada                AS "coverImage",
    m.imagen_tarjeta                AS "cardImage",
    m.descripcion                   AS description,
    COALESCE(m.is_active, TRUE)     AS "isActive",
    m.origen                        AS source,
    m.url_origen                    AS "sourceUrl",
    m.fecha_creacion                AS "createdAt",
    m.fecha_actualizacion           AS "updatedAt"
  FROM museos.museos m
`;

@Injectable()
export class AdminMuseumsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Misma lógica que turismo.fn_slugify y que el panel. */
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ id_museo: number }[]>`
      SELECT id_museo FROM museos.museos
      WHERE slug = ${slug} ${excludeId ? Prisma.sql`AND id_museo <> ${excludeId}` : Prisma.empty}
      LIMIT 1`;
    return rows.length > 0;
  }

  /** Texto de ubicación con el formato 'DEPARTAMENTO / PROVINCIA / DISTRITO'. */
  private ubigeoText(loc: LocationRow): string {
    return `${loc.department} / ${loc.province} / ${loc.district}`;
  }

  async findAll(query: QueryMuseumDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: Prisma.Sql[] = [];

    if (query.search?.trim()) {
      conditions.push(Prisma.sql`
        turismo.f_unaccent(lower(concat_ws(' ', m.nombre, m.departamento, m.provincia, m.distrito)))
        LIKE '%' || turismo.f_unaccent(lower(${query.search.trim()})) || '%'`);
    }
    if (query.department) {
      conditions.push(Prisma.sql`
        turismo.f_unaccent(lower(m.departamento)) = turismo.f_unaccent(lower(${query.department}))`);
    }
    if (query.status) {
      conditions.push(Prisma.sql`m.estado = ${query.status}`);
    }
    if (query.source) {
      conditions.push(Prisma.sql`m.origen = ${query.source}`);
    }
    if (query.isActive !== undefined) {
      conditions.push(Prisma.sql`COALESCE(m.is_active, TRUE) = ${query.isActive}`);
    }

    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const [countRows, items] = await Promise.all([
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total FROM museos.museos m ${where}`,
      this.prisma.$queryRaw`
        ${SELECT_MUSEUM} ${where}
        ORDER BY m.nombre ASC, m.id_museo ASC
        LIMIT ${limit} OFFSET ${offset}`,
    ]);

    const total = Number(countRows[0]?.total ?? 0);

    return {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRaw<{ id: number; source: string }[]>`
      ${SELECT_MUSEUM} WHERE m.id_museo = ${id}`;

    if (!rows.length) {
      throw new NotFoundException(`Museo con id "${id}" no encontrado`);
    }

    return {
      success: true,
      data: rows[0],
    };
  }

  /** Categorías, tipos, administraciones, estados y departamentos para los selects del panel. */
  async getOptions() {
    const distinct = (column: Prisma.Sql) =>
      this.prisma.$queryRaw<{ value: string }[]>`
        SELECT DISTINCT ${column} AS value FROM museos.museos
        WHERE ${column} IS NOT NULL AND ${column} <> '' ORDER BY 1`;

    const [categories, museumTypes, administrations, statuses, departments] = await Promise.all([
      distinct(Prisma.sql`categoria`),
      distinct(Prisma.sql`tipo_museo`),
      distinct(Prisma.sql`administracion`),
      distinct(Prisma.sql`estado`),
      this.prisma.$queryRaw`
        SELECT id_departamento AS id, nombre AS name FROM turismo.departamentos ORDER BY nombre`,
    ]);

    const values = (rows: { value: string }[]) => rows.map((r) => r.value);

    return {
      success: true,
      data: {
        categories: values(categories),
        museumTypes: values(museumTypes),
        administrations: values(administrations),
        statuses: Array.from(new Set([...MUSEUM_STATUSES, ...values(statuses)])),
        departments,
      },
    };
  }

  async create(dto: CreateMuseumDto) {
    const location = dto.ubigeo ? await resolveLocation(this.prisma, dto.ubigeo) : null;

    // Slug único: si ya existe se añade un sufijo numérico (-2, -3, …)
    const base = this.slugify(dto.slug || dto.name) || 'museo';
    let slug = base;
    for (let n = 2; await this.slugExists(slug); n++) {
      slug = `${base}-${n}`;
    }

    const [{ id }] = await this.prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO museos.museos (
        slug, nombre, categoria, tipo_museo, administracion, estado,
        ubigeo, ubigeo_texto, departamento, provincia, distrito,
        direccion, latitud, longitud,
        horario_atencion, tarifario_descripcion,
        telefono, email, web_url, recorrido_virtual_url, coleccion_virtual_url,
        facebook_url, instagram_url, twitter_url, youtube_url, tiktok_url,
        imagen_portada, imagen_tarjeta, descripcion,
        url_origen, is_active, origen
      ) VALUES (
        ${slug}, ${dto.name.trim()},
        ${dto.category?.trim() || 'Ministerio de Cultura'},
        ${dto.museumType?.trim() || null}, ${dto.administration?.trim() || null},
        ${dto.status ?? 'Abierto'},
        ${location?.ubigeo ?? null}, ${location ? this.ubigeoText(location) : null},
        ${location?.department ?? null}, ${location?.province ?? null}, ${location?.district ?? null},
        ${dto.address?.trim() || null}, ${dto.latitude ?? null}, ${dto.longitude ?? null},
        ${dto.openingHours?.trim() || null}, ${dto.feesDescription?.trim() || null},
        ${dto.phone?.trim() || null}, ${dto.email ?? null}, ${dto.websiteUrl ?? null},
        ${dto.virtualTourUrl ?? null}, ${dto.virtualCollectionUrl ?? null},
        ${dto.facebookUrl ?? null}, ${dto.instagramUrl ?? null}, ${dto.twitterUrl ?? null},
        ${dto.youtubeUrl ?? null}, ${dto.tiktokUrl ?? null},
        ${dto.coverImage ?? null}, ${dto.cardImage ?? null}, ${dto.description?.trim() || null},
        'panel:manual', ${dto.isActive ?? true}, 'manual'
      )
      RETURNING id_museo AS id`;

    const { data } = await this.findOne(id);
    return {
      success: true,
      message: 'Museo creado correctamente',
      data,
    };
  }

  async update(id: number, dto: UpdateMuseumDto) {
    const { data: current } = await this.findOne(id);

    const sets: Prisma.Sql[] = [];

    if (dto.name !== undefined) sets.push(Prisma.sql`nombre = ${dto.name.trim()}`);
    if (dto.status !== undefined) sets.push(Prisma.sql`estado = ${dto.status || 'Abierto'}`);
    if (dto.latitude !== undefined) sets.push(Prisma.sql`latitud = ${dto.latitude}`);
    if (dto.longitude !== undefined) sets.push(Prisma.sql`longitud = ${dto.longitude}`);
    if (dto.isActive !== undefined) sets.push(Prisma.sql`is_active = ${dto.isActive}`);

    for (const [key, column] of TEXT_COLUMNS) {
      const value = dto[key];
      if (value !== undefined) {
        const clean = typeof value === 'string' ? value.trim() || null : value;
        sets.push(Prisma.sql`${Prisma.raw(column)} = ${clean}`);
      }
    }

    if (dto.slug !== undefined) {
      const slug = this.slugify(dto.slug ?? '');
      if (!slug) throw new BadRequestException('El slug no puede estar vacío');
      if (await this.slugExists(slug, id)) {
        throw new ConflictException(`El slug "${slug}" ya está en uso.`);
      }
      sets.push(Prisma.sql`slug = ${slug}`);
    }

    if (dto.ubigeo !== undefined) {
      if (dto.ubigeo) {
        const loc = await resolveLocation(this.prisma, dto.ubigeo);
        sets.push(Prisma.sql`
          ubigeo = ${loc.ubigeo}, ubigeo_texto = ${this.ubigeoText(loc)},
          departamento = ${loc.department}, provincia = ${loc.province}, distrito = ${loc.district}`);
      } else {
        sets.push(Prisma.sql`
          ubigeo = NULL, ubigeo_texto = NULL, departamento = NULL, provincia = NULL, distrito = NULL`);
      }
    }

    if (sets.length) {
      await this.prisma.$executeRaw`
        UPDATE museos.museos SET ${Prisma.join(sets, ', ')} WHERE id_museo = ${id}`;
    }

    // Todo lo que no sea isActive lo sobrescribe el scraper
    const contentChanged = (Object.keys(dto) as (keyof UpdateMuseumDto)[]).some(
      (k) => k !== 'isActive' && dto[k] !== undefined,
    );
    const warnings =
      current.source === 'importado' && contentChanged
        ? ['Este museo proviene del scraping de museos.cultura.pe: los cambios de contenido se sobrescribirán en el próximo scraping.']
        : [];

    const { data } = await this.findOne(id);
    return {
      success: true,
      message: 'Museo actualizado correctamente',
      warnings,
      data,
    };
  }

  async remove(id: number) {
    const { data } = await this.findOne(id);

    if (data.source !== 'manual') {
      throw new ConflictException(
        'Los museos importados no se pueden eliminar (el próximo scraping los volvería a crear). Desactívalo con isActive=false.',
      );
    }

    // museo_servicios, museo_tarifas y museo_fotos se eliminan en cascada
    await this.prisma.$executeRaw`
      DELETE FROM museos.museos WHERE id_museo = ${id} AND origen = 'manual'`;

    return {
      success: true,
      message: 'Museo eliminado correctamente',
    };
  }
}
