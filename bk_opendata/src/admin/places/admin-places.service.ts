import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTouristPlaceDto } from './dto/create-place.dto';
import { UpdateTouristPlaceDto } from './dto/update-place.dto';
import { QueryTouristPlaceDto } from './dto/query-place.dto';
import { resolveLocation } from '../shared/location.helper';

/**
 * Gestión de lugares turísticos sobre turismo.recursos (la misma tabla que
 * alimenta el scraper de MINCETUR y la web pública).
 *
 * - origen = 'mincetur': registros del scraper. Sus campos base (nombre,
 *   ubicación, categoría, url_ficha) se sobrescriben en cada scraping; los
 *   campos SEO, descripción e is_active se conservan.
 * - origen = 'manual': creados desde el panel, con códigos >= 900001.
 */

/** Campos que el scraper sobrescribe en su ON CONFLICT DO UPDATE. */
const SCRAPER_MANAGED: (keyof UpdateTouristPlaceDto)[] = ['name', 'ubigeo', 'categoryId'];

const SELECT_PLACE = Prisma.sql`
  SELECT
    r.codigo                                  AS id,
    r.nombre                                  AS name,
    r.slug,
    r.descripcion                             AS description,
    r.id_categoria                            AS "categoryId",
    COALESCE(c.nombre, r.categoria_nombre)    AS category,
    r.tipo_categoria_nombre                   AS type,
    r.jerarquia                               AS hierarchy,
    r.departamento                            AS department,
    r.provincia                               AS province,
    r.distrito                                AS district,
    r.ubigeo,
    r.foto_principal                          AS "imageUrl",
    r.url_ficha                               AS "sourceUrl",
    COALESCE(r.is_active, TRUE)               AS "isPublished",
    r.latitud::float8                         AS latitude,
    r.longitud::float8                        AS longitude,
    r.meta_title                              AS "metaTitle",
    r.meta_description                        AS "metaDescription",
    r.keywords,
    r.origen                                  AS source,
    r.fecha_creacion                          AS "createdAt",
    r.fecha_actualizacion                     AS "updatedAt"
  FROM turismo.recursos r
  LEFT JOIN turismo.categorias c ON c.id_categoria = r.id_categoria
`;

@Injectable()
export class AdminPlacesService {
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
    const rows = await this.prisma.$queryRaw<{ codigo: number }[]>`
      SELECT codigo FROM turismo.recursos
      WHERE slug = ${slug} ${excludeId ? Prisma.sql`AND codigo <> ${excludeId}` : Prisma.empty}
      LIMIT 1`;
    return rows.length > 0;
  }

  /** Resuelve la ubicación conservando la grafía de departamento de recursos. */
  private resolveLocation(ubigeo: string) {
    return resolveLocation(this.prisma, ubigeo, { useRecursosSpelling: true });
  }

  private async resolveCategoryName(categoryId: number): Promise<string> {
    const rows = await this.prisma.$queryRaw<{ nombre: string }[]>`
      SELECT nombre FROM turismo.categorias WHERE id_categoria = ${categoryId}`;
    if (!rows.length) {
      throw new BadRequestException(`La categoría ${categoryId} no existe`);
    }
    return rows[0].nombre;
  }

  async findAll(query: QueryTouristPlaceDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: Prisma.Sql[] = [];

    if (query.search?.trim()) {
      // Aprovecha el índice trigram idx_recursos_search_trgm
      conditions.push(Prisma.sql`
        turismo.f_unaccent(lower(r.nombre || ' ' || r.departamento || ' ' || r.provincia || ' ' || r.distrito))
        LIKE '%' || turismo.f_unaccent(lower(${query.search.trim()})) || '%'`);
    }
    if (query.department) {
      conditions.push(Prisma.sql`
        turismo.f_unaccent(lower(r.departamento)) = turismo.f_unaccent(lower(${query.department}))`);
    }
    if (query.categoryId) {
      conditions.push(Prisma.sql`r.id_categoria = ${query.categoryId}`);
    }
    if (query.source) {
      conditions.push(Prisma.sql`r.origen = ${query.source}`);
    }
    if (query.isPublished !== undefined) {
      conditions.push(Prisma.sql`COALESCE(r.is_active, TRUE) = ${query.isPublished}`);
    }

    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const [countRows, items] = await Promise.all([
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total FROM turismo.recursos r ${where}`,
      this.prisma.$queryRaw`
        ${SELECT_PLACE} ${where}
        ORDER BY r.fecha_actualizacion DESC NULLS LAST, r.codigo DESC
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
      ${SELECT_PLACE} WHERE r.codigo = ${id}`;

    if (!rows.length) {
      throw new NotFoundException(`Lugar turístico con código "${id}" no encontrado`);
    }

    return {
      success: true,
      data: rows[0],
    };
  }

  /** Categorías y departamentos para los selects del panel. */
  async getOptions() {
    const [categories, departments] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT id_categoria AS id, nombre AS name FROM turismo.categorias ORDER BY id_categoria`,
      this.prisma.$queryRaw`
        SELECT id_departamento AS id, nombre AS name FROM turismo.departamentos ORDER BY nombre`,
    ]);
    return { success: true, data: { categories, departments } };
  }

  /** Provincias de un departamento (2 dígitos) o distritos de una provincia (4 dígitos). */
  async getUbigeoChildren(parent: string) {
    if (/^\d{2}$/.test(parent)) {
      const data = await this.prisma.$queryRaw`
        SELECT id_provincia AS id, nombre AS name FROM turismo.provincias
        WHERE id_departamento = ${parent} ORDER BY nombre`;
      return { success: true, data };
    }
    if (/^\d{4}$/.test(parent)) {
      const data = await this.prisma.$queryRaw`
        SELECT ubigeo AS id, nombre AS name FROM turismo.distritos
        WHERE id_provincia = ${parent} ORDER BY nombre`;
      return { success: true, data };
    }
    throw new BadRequestException('El parámetro "parent" debe tener 2 (departamento) o 4 (provincia) dígitos');
  }

  async create(dto: CreateTouristPlaceDto) {
    const location = await this.resolveLocation(dto.ubigeo);
    const categoryName = dto.categoryId ? await this.resolveCategoryName(dto.categoryId) : null;

    const [{ codigo }] = await this.prisma.$queryRaw<{ codigo: bigint }[]>`
      SELECT nextval('turismo.recursos_manual_codigo_seq') AS codigo`;
    const id = Number(codigo);

    let slug = this.slugify(dto.slug || dto.name) || `lugar-${id}`;
    if (await this.slugExists(slug)) slug = `${slug}-${id}`;

    const description = dto.description?.trim() || null;

    await this.prisma.$executeRaw`
      INSERT INTO turismo.recursos (
        codigo, nombre, slug, descripcion,
        id_categoria, categoria_nombre,
        ubigeo, departamento, provincia, distrito,
        latitud, longitud, foto_principal, is_active,
        meta_title, meta_description, keywords, origen
      ) VALUES (
        ${id}, ${dto.name.trim()}, ${slug}, ${description},
        ${dto.categoryId ?? null}, ${categoryName},
        ${location.ubigeo}, ${location.department}, ${location.province}, ${location.district},
        ${dto.latitude}, ${dto.longitude}, ${dto.imageUrl ?? null}, ${dto.isPublished ?? true},
        ${dto.metaTitle?.trim() || dto.name.trim()},
        ${dto.metaDescription?.trim() || description?.slice(0, 160) || null},
        ${dto.keywords ?? null}, 'manual'
      )`;

    const { data } = await this.findOne(id);
    return {
      success: true,
      message: 'Lugar turístico creado correctamente',
      data,
    };
  }

  async update(id: number, dto: UpdateTouristPlaceDto) {
    const { data: current } = await this.findOne(id);

    const sets: Prisma.Sql[] = [];

    if (dto.name !== undefined) sets.push(Prisma.sql`nombre = ${dto.name.trim()}`);
    if (dto.description !== undefined) sets.push(Prisma.sql`descripcion = ${dto.description || null}`);
    if (dto.imageUrl !== undefined) sets.push(Prisma.sql`foto_principal = ${dto.imageUrl || null}`);
    if (dto.isPublished !== undefined) sets.push(Prisma.sql`is_active = ${dto.isPublished}`);
    if (dto.latitude !== undefined) sets.push(Prisma.sql`latitud = ${dto.latitude}`);
    if (dto.longitude !== undefined) sets.push(Prisma.sql`longitud = ${dto.longitude}`);
    if (dto.metaTitle !== undefined) sets.push(Prisma.sql`meta_title = ${dto.metaTitle || null}`);
    if (dto.metaDescription !== undefined) sets.push(Prisma.sql`meta_description = ${dto.metaDescription || null}`);
    if (dto.keywords !== undefined) sets.push(Prisma.sql`keywords = ${dto.keywords || null}`);

    if (dto.slug !== undefined) {
      const slug = this.slugify(dto.slug);
      if (!slug) throw new BadRequestException('El slug no puede estar vacío');
      if (await this.slugExists(slug, id)) {
        throw new ConflictException(`El slug "${slug}" ya está en uso.`);
      }
      sets.push(Prisma.sql`slug = ${slug}`);
    }

    if (dto.categoryId !== undefined) {
      const name = await this.resolveCategoryName(dto.categoryId);
      sets.push(Prisma.sql`id_categoria = ${dto.categoryId}, categoria_nombre = ${name}`);
    }

    if (dto.ubigeo !== undefined) {
      const loc = await this.resolveLocation(dto.ubigeo);
      sets.push(Prisma.sql`
        ubigeo = ${loc.ubigeo}, departamento = ${loc.department},
        provincia = ${loc.province}, distrito = ${loc.district}`);
    }

    if (sets.length) {
      await this.prisma.$executeRaw`
        UPDATE turismo.recursos SET ${Prisma.join(sets, ', ')} WHERE codigo = ${id}`;
    }

    const warnings =
      current.source === 'mincetur' &&
      SCRAPER_MANAGED.some((k) => dto[k] !== undefined)
        ? ['Este registro proviene de MINCETUR: nombre, ubicación y categoría se sobrescribirán en el próximo scraping.']
        : [];

    const { data } = await this.findOne(id);
    return {
      success: true,
      message: 'Lugar turístico actualizado correctamente',
      warnings,
      data,
    };
  }

  async remove(id: number) {
    const { data } = await this.findOne(id);

    if (data.source !== 'manual') {
      throw new ConflictException(
        'Los registros de MINCETUR no se pueden eliminar desde el panel (el scraper los volvería a crear). Despublícalo con isPublished=false.',
      );
    }

    await this.prisma.$executeRaw`DELETE FROM turismo.recursos WHERE codigo = ${id}`;

    return {
      success: true,
      message: 'Lugar turístico eliminado correctamente',
    };
  }
}
