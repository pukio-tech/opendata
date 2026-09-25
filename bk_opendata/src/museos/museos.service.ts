import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool, QueryResult } from 'pg';

export interface MuseoItem {
  id_museo: number;
  slug: string;
  nombre: string;
  categoria?: string;
  tipo_museo?: string;
  administracion?: string;
  estado?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  ubigeo_texto?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  horario_atencion?: string;
  tarifario_descripcion?: string;
  telefono?: string;
  email?: string;
  web_url?: string;
  recorrido_virtual_url?: string;
  coleccion_virtual_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  imagen_portada?: string;
  imagen_tarjeta?: string;
  descripcion?: string;
  servicios?: Array<{ nombre: string; icono_url?: string }>;
  tarifas?: Array<{ tipo: string; descripcion: string; precio: number; moneda: string }>;
  galeria?: Array<{ url: string; alt?: string }>;
  url_origen?: string;
  total_fotos?: number;
  fecha_actualizacion?: string;
}

export interface MuseoSearchResult {
  data: MuseoItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class MuseosService implements OnModuleDestroy {
  private readonly logger = new Logger(MuseosService.name);
  private pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_F3mJO2YWCcIX@ep-little-heart-b5n0hrdb-pooler.c-7.us-east-2.aws.neon.tech/opendata?sslmode=require';

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async executeSql<T = any>(
    sql: string,
    params: any[] = [],
    operationName: string = 'SQL Query',
  ): Promise<QueryResult<T>> {
    const t0 = Date.now();
    try {
      const res = await this.pool.query<T>(sql, params);
      const duration = Date.now() - t0;
      const count = res.rowCount ?? (Array.isArray(res.rows) ? res.rows.length : 0);
      this.logger.log(
        `[PostgreSQL Museos] ${operationName} -> ${count} filas (${duration}ms)`,
      );
      return res;
    } catch (err) {
      const duration = Date.now() - t0;
      this.logger.error(
        `[PostgreSQL Museos] [ERROR] Error en ${operationName} (${duration}ms): ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  // 1. Departamentos con conteo de museos
  async getDepartments(): Promise<Array<{ departamento: string; count: number }>> {
    const sql = `
      SELECT 
        COALESCE(NULLIF(departamento, ''), 'SIN ESPECIFICAR') as departamento,
        COUNT(*)::int as count
      FROM museos.museos
      WHERE is_active = TRUE
      GROUP BY departamento
      ORDER BY departamento ASC;
    `;
    const res = await this.executeSql(sql, [], 'getDepartments');
    return res.rows;
  }

  // 2. Categorías de museos
  async getCategories(): Promise<Array<{ categoria: string; count: number }>> {
    const sql = `
      SELECT 
        COALESCE(NULLIF(categoria, ''), 'Ministerio de Cultura') as categoria,
        COUNT(*)::int as count
      FROM museos.museos
      WHERE is_active = TRUE
      GROUP BY categoria
      ORDER BY count DESC;
    `;
    const res = await this.executeSql(sql, [], 'getCategories');
    return res.rows;
  }

  // 3. Catálogo de Servicios
  async getServices(): Promise<Array<{ id_servicio: number; nombre: string; icono_url: string }>> {
    const sql = `
      SELECT id_servicio, nombre, icono_url
      FROM museos.servicios_catalogo
      ORDER BY nombre ASC;
    `;
    const res = await this.executeSql(sql, [], 'getServices');
    return res.rows;
  }

  // 4. Búsqueda y Listado con Filtros
  async searchMuseos(options: {
    search?: string;
    department?: string;
    category?: string;
    status?: string;
    hasVirtualTour?: boolean;
    page?: number;
    limit?: number;
  }): Promise<MuseoSearchResult> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 12));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['m.is_active = TRUE'];
    const params: any[] = [];
    let pIdx = 1;

    // Filtro por término de búsqueda (FTS + Trigram + ILIKE)
    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      conditions.push(`(
        m.nombre ILIKE $${pIdx} OR 
        m.descripcion ILIKE $${pIdx} OR 
        m.departamento ILIKE $${pIdx} OR 
        m.provincia ILIKE $${pIdx} OR 
        m.distrito ILIKE $${pIdx} OR 
        m.direccion ILIKE $${pIdx}
      )`);
      params.push(term);
      pIdx++;
    }

    // Filtro por departamento
    if (options.department && options.department.trim()) {
      conditions.push(`m.departamento ILIKE $${pIdx}`);
      params.push(`%${options.department.trim()}%`);
      pIdx++;
    }

    // Filtro por categoría
    if (options.category && options.category.trim()) {
      conditions.push(`m.categoria ILIKE $${pIdx}`);
      params.push(`%${options.category.trim()}%`);
      pIdx++;
    }

    // Filtro por estado
    if (options.status && options.status.trim()) {
      conditions.push(`m.estado ILIKE $${pIdx}`);
      params.push(`%${options.status.trim()}%`);
      pIdx++;
    }

    // Filtro por recorrido virtual
    if (options.hasVirtualTour) {
      conditions.push(`(m.recorrido_virtual_url IS NOT NULL AND m.recorrido_virtual_url <> '')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Conteo total
    const countSql = `SELECT COUNT(*)::int as total FROM museos.museos m ${whereClause};`;
    const countRes = await this.executeSql(countSql, params, 'searchMuseosCount');
    const total = countRes.rows[0]?.total || 0;

    // Consulta de datos
    const dataSql = `
      SELECT 
        m.id_museo,
        m.slug,
        m.nombre,
        m.categoria,
        m.tipo_museo,
        m.administracion,
        m.estado,
        m.departamento,
        m.provincia,
        m.distrito,
        m.ubigeo_texto,
        m.direccion,
        m.latitud,
        m.longitud,
        m.horario_atencion,
        m.tarifario_descripcion,
        m.telefono,
        m.email,
        m.web_url,
        m.recorrido_virtual_url,
        m.coleccion_virtual_url,
        m.facebook_url,
        m.instagram_url,
        m.twitter_url,
        m.youtube_url,
        m.tiktok_url,
        m.imagen_portada,
        m.imagen_tarjeta,
        m.descripcion,
        m.servicios_json AS servicios,
        m.tarifas_json AS tarifas,
        m.galeria_json AS galeria,
        jsonb_array_length(m.galeria_json) AS total_fotos,
        m.fecha_actualizacion
      FROM museos.museos m
      ${whereClause}
      ORDER BY m.departamento ASC, m.nombre ASC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};
    `;

    const dataRes = await this.executeSql(
      dataSql,
      [...params, limit, offset],
      'searchMuseosData',
    );

    return {
      data: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // 5. GeoJSON para mapas interactivos
  async getGeoJson(options?: { department?: string; category?: string }) {
    const conditions: string[] = ['m.is_active = TRUE', 'm.geom IS NOT NULL'];
    const params: any[] = [];
    let pIdx = 1;

    if (options?.department) {
      conditions.push(`m.departamento ILIKE $${pIdx}`);
      params.push(`%${options.department}%`);
      pIdx++;
    }

    if (options?.category) {
      conditions.push(`m.categoria ILIKE $${pIdx}`);
      params.push(`%${options.category}%`);
      pIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sql = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(m.geom)::json,
            'properties', json_build_object(
              'id_museo', m.id_museo,
              'slug', m.slug,
              'nombre', m.nombre,
              'categoria', m.categoria,
              'administracion', m.administracion,
              'estado', m.estado,
              'departamento', m.departamento,
              'provincia', m.provincia,
              'distrito', m.distrito,
              'direccion', m.direccion,
              'horario', m.horario_atencion,
              'imagen_portada', m.imagen_portada,
              'imagen_tarjeta', m.imagen_tarjeta,
              'recorrido_virtual_url', m.recorrido_virtual_url,
              'servicios', m.servicios_json
            )
          )
        ), '[]'::json)
      ) AS geojson
      FROM museos.museos m
      ${whereClause};
    `;

    const res = await this.executeSql(sql, params, 'getGeoJson');
    return res.rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
  }

  // 6. Museos destacados (con fotos y recorridos virtuales)
  async getFeatured(limit: number = 6): Promise<MuseoItem[]> {
    const sql = `
      SELECT 
        m.id_museo,
        m.slug,
        m.nombre,
        m.categoria,
        m.administracion,
        m.estado,
        m.departamento,
        m.provincia,
        m.distrito,
        m.direccion,
        m.latitud,
        m.longitud,
        m.horario_atencion,
        m.imagen_portada,
        m.imagen_tarjeta,
        m.recorrido_virtual_url,
        m.descripcion,
        m.servicios_json AS servicios,
        m.tarifas_json AS tarifas,
        m.galeria_json AS galeria,
        jsonb_array_length(m.galeria_json) AS total_fotos
      FROM museos.museos m
      WHERE m.is_active = TRUE AND m.imagen_portada IS NOT NULL AND m.imagen_portada <> ''
      ORDER BY 
        CASE WHEN m.recorrido_virtual_url IS NOT NULL AND m.recorrido_virtual_url <> '' THEN 0 ELSE 1 END,
        jsonb_array_length(m.galeria_json) DESC
      LIMIT $1;
    `;
    const res = await this.executeSql(sql, [limit], 'getFeatured');
    return res.rows;
  }

  // 7. Detalle de un Museo por Slug o ID
  async getDetail(slugOrId: string): Promise<MuseoItem> {
    let decodedSlug = slugOrId;
    try {
      decodedSlug = decodeURIComponent(decodeURIComponent(slugOrId));
    } catch {
      try {
        decodedSlug = decodeURIComponent(slugOrId);
      } catch {
        decodedSlug = slugOrId;
      }
    }

    const isNumeric = !isNaN(Number(decodedSlug)) && !decodedSlug.includes('-');
    let sql: string;
    let params: any[];

    if (isNumeric) {
      sql = `
        SELECT 
          m.id_museo,
          m.slug,
          m.nombre,
          m.categoria,
          m.tipo_museo,
          m.administracion,
          m.estado,
          m.departamento,
          m.provincia,
          m.distrito,
          m.ubigeo_texto,
          m.direccion,
          m.latitud,
          m.longitud,
          m.horario_atencion,
          m.tarifario_descripcion,
          m.telefono,
          m.email,
          m.web_url,
          m.recorrido_virtual_url,
          m.coleccion_virtual_url,
          m.facebook_url,
          m.instagram_url,
          m.twitter_url,
          m.youtube_url,
          m.tiktok_url,
          m.imagen_portada,
          m.imagen_tarjeta,
          m.descripcion,
          m.servicios_json AS servicios,
          m.tarifas_json AS tarifas,
          m.galeria_json AS galeria,
          m.url_origen,
          m.fecha_actualizacion
        FROM museos.museos m
        WHERE m.id_museo = $1 AND m.is_active = TRUE
        LIMIT 1;
      `;
      params = [Number(decodedSlug)];
    } else {
      sql = `
        SELECT 
          m.id_museo,
          m.slug,
          m.nombre,
          m.categoria,
          m.tipo_museo,
          m.administracion,
          m.estado,
          m.departamento,
          m.provincia,
          m.distrito,
          m.ubigeo_texto,
          m.direccion,
          m.latitud,
          m.longitud,
          m.horario_atencion,
          m.tarifario_descripcion,
          m.telefono,
          m.email,
          m.web_url,
          m.recorrido_virtual_url,
          m.coleccion_virtual_url,
          m.facebook_url,
          m.instagram_url,
          m.twitter_url,
          m.youtube_url,
          m.tiktok_url,
          m.imagen_portada,
          m.imagen_tarjeta,
          m.descripcion,
          m.servicios_json AS servicios,
          m.tarifas_json AS tarifas,
          m.galeria_json AS galeria,
          m.url_origen,
          m.fecha_actualizacion
        FROM museos.museos m
        WHERE (
          m.slug = $1 OR 
          m.slug = $2 OR 
          m.slug ILIKE $1 OR 
          m.slug ILIKE $2 OR
          unaccent(m.slug) ILIKE unaccent($1) OR
          unaccent(m.slug) ILIKE unaccent($2)
        ) AND m.is_active = TRUE
        LIMIT 1;
      `;
      params = [decodedSlug, slugOrId];
    }

    const res = await this.executeSql(sql, params, 'getDetail');
    if (!res.rows[0]) {
      throw new HttpException(
        `Museo no encontrado: ${slugOrId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return res.rows[0];
  }

  // 8. Estadísticas generales
  async getStats() {
    const sql = `
      SELECT 
        COUNT(*)::int as total_museos,
        COUNT(*) FILTER (WHERE estado ILIKE '%Abierto%')::int as total_abiertos,
        COUNT(*) FILTER (WHERE categoria ILIKE '%Ministerio de Cultura%')::int as total_mincultura,
        COUNT(*) FILTER (WHERE recorrido_virtual_url IS NOT NULL AND recorrido_virtual_url <> '')::int as total_virtuales,
        COUNT(*) FILTER (WHERE latitud IS NOT NULL)::int as total_georreferenciados,
        COUNT(DISTINCT departamento)::int as departamentos_cubiertos
      FROM museos.museos
      WHERE is_active = TRUE;
    `;
    const res = await this.executeSql(sql, [], 'getStats');
    return res.rows[0];
  }

  // 9. Listado para Sitemap SEO
  async getSitemap(): Promise<Array<{ slug: string; fecha_actualizacion?: string }>> {
    const sql = `
      SELECT slug, fecha_actualizacion
      FROM museos.museos
      WHERE is_active = TRUE
      ORDER BY id_museo ASC;
    `;
    const res = await this.executeSql(sql, [], 'getSitemap');
    return res.rows;
  }
}
