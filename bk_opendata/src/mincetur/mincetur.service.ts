import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool, QueryResult } from 'pg';

export interface ActivityItem {
  id?: number;
  codigo?: string;
  id_actividad?: number;
  atrac_acti?: number;
  id_subactividad?: number | null;
  atrac_acti_tipo?: number | null;
  nombre: string;
  codigo_tipo?: string;
  tipocate_codigo?: string;
  imagen?: string | null;
  sub_actividades?: ActivityItem[];
}

export interface ResourceItem {
  codigo: number;
  nombre: string;
  categoria?: string;
  tipo_categoria?: string;
  subtipo_categoria?: string;
  desdpto?: string;
  departamento?: string;
  desprov?: string;
  provincia?: string;
  desubigeo?: string;
  distrito?: string;
  x?: number;
  y?: number;
  coordenadas?: {
    latitud?: number;
    longitud?: number;
  };
  url?: string;
  url_ficha?: string;
  desjerarquia?: string;
  jerarquia?: string;
  imagen?: string | null;
  foto_url?: string;
}

export interface FichaSection {
  id?: string;
  titulo: string;
  contenido?: string;
  contenido_texto?: string;
  contenido_html?: string;
}

export interface FichaActivity {
  actividad: string;
  tipo: string;
  observacion: string;
  icono_url?: string | null;
}

export interface FichaRutaAcceso {
  recorrido?: string;
  tramo?: string;
  detalle?: string;
  tipo_acceso?: string;
  medio_transporte?: string;
  tipo_via?: string;
  distancia_tiempo?: string;
}

export interface FichaEpocaPropicia {
  epoca?: string;
  especificacion?: string;
  horario?: string;
  observaciones?: string;
}

export interface FichaDetail {
  cod_ficha: number;
  url_ficha: string;
  nombre: string;
  departamento: string;
  provincia: string;
  distrito: string;
  categoria: string;
  tipo: string;
  subtipo: string;
  jerarquia: string;
  altitud: string;
  x?: number;
  y?: number;
  coordenadas?: {
    latitud?: number;
    longitud?: number;
  };
  google_maps_url?: string;
  foto_principal?: string | null;
  galeria_fotos: string[];
  actividades_permitidas: string[];
  actividades_detalle?: FichaActivity[];
  rutas_acceso?: FichaRutaAcceso[];
  epoca_propicia?: FichaEpocaPropicia[];
  tipo_ingreso?: Array<{ tipo: string; observaciones: string }>;
  servicios_turisticos?: Array<{
    ubicacion: string;
    instalacion?: string;
    servicio?: string;
    tipo_servicio?: string;
    observacion?: string;
  }>;
  descripcion: string;
  particularidades?: string;
  estado_actual?: string;
  observaciones?: string;
  youtube_url?: string;
  youtube_id?: string;
  youtube_embed_url?: string;
  secciones?: FichaSection[];
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
export class MinceturService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MinceturService.name);
  private pool: Pool;
  private readonly startTime = Date.now();
  private totalRequests = 0;

  private readonly UBIGEO_DEP_MAP: Record<string, string> = {
    '01': 'AMAZONAS',
    '02': 'ANCASH',
    '03': 'APURIMAC',
    '04': 'AREQUIPA',
    '05': 'AYACUCHO',
    '06': 'CAJAMARCA',
    '07': 'CALLAO',
    '08': 'CUSCO',
    '09': 'HUANCAVELICA',
    '10': 'HUANUCO',
    '11': 'ICA',
    '12': 'JUNIN',
    '13': 'LA LIBERTAD',
    '14': 'LAMBAYEQUE',
    '15': 'LIMA',
    '16': 'LORETO',
    '17': 'MADRE DE DIOS',
    '18': 'MOQUEGUA',
    '19': 'PASCO',
    '20': 'PIURA',
    '21': 'PUNO',
    '22': 'SAN MARTIN',
    '23': 'TACNA',
    '24': 'TUMBES',
    '25': 'UCAYALI',
  };

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

  // Ejecutor centralizado de consultas SQL con registro de métricas y tiempo de respuesta
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
        `[PostgreSQL] ${operationName} -> ${count} filas (${duration}ms) ${params.length > 0 ? '| Params: ' + JSON.stringify(params) : ''}`,
      );
      return res;
    } catch (err) {
      const duration = Date.now() - t0;
      this.logger.error(
        `[PostgreSQL] [ERROR] Error en ${operationName} (${duration}ms): ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async onModuleInit() {
    try {
      const res = await this.executeSql(
        'SELECT count(*) AS total, count(*) FILTER (WHERE is_active = true) AS activos FROM turismo.recursos',
        [],
        'Verificación de Inicio (Recursos en BD)',
      );
      this.logger.log(
        `Conexión lista a PostgreSQL (Neon DB). Recursos en BD: ${res.rows[0].total} (Activos: ${res.rows[0].activos})`,
      );
    } catch (err) {
      this.logger.error(
        `Error al conectar a PostgreSQL: ${err.message}`,
        err.stack,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.pool.end();
      this.logger.log('Conexiones a PostgreSQL cerradas correctamente.');
    } catch (err) {
      this.logger.error(`Error al cerrar pool de PostgreSQL: ${err.message}`);
    }
  }

  // Health check
  async getHealth() {
    this.totalRequests++;
    try {
      const statsRes = await this.executeSql(
        `
        SELECT 
          (SELECT count(*) FROM turismo.recursos) AS total_recursos,
          (SELECT count(*) FROM turismo.recursos WHERE is_active = true) AS total_activos,
          (SELECT count(*) FROM turismo.departamentos) AS total_departamentos,
          (SELECT count(*) FROM turismo.categorias) AS total_categorias,
          (SELECT count(*) FROM turismo.actividades) AS total_actividades
        `,
        [],
        'Consulta de Salud / Diagnóstico',
      );

      return {
        status: 'healthy',
        storage: 'postgresql_neon',
        database: 'connected',
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        totalRequests: this.totalRequests,
        totalResourcesInDb: Number(statsRes.rows[0].total_recursos || 0),
        totalActiveResources: Number(statsRes.rows[0].total_activos || 0),
        totalDepartments: Number(statsRes.rows[0].total_departamentos || 0),
        totalCategories: Number(statsRes.rows[0].total_categorias || 0),
        totalActivities: Number(statsRes.rows[0].total_actividades || 0),
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
        memoryUsage: process.memoryUsage(),
      };
    } catch (err) {
      return {
        status: 'degraded',
        storage: 'postgresql_neon',
        database: 'error',
        error: err.message,
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        totalRequests: this.totalRequests,
      };
    }
  }

  // 1. Obtener Árbol de Categorías
  async getCategoriesTree(): Promise<any[]> {
    this.totalRequests++;
    try {
      const res = await this.executeSql(
        'SELECT arbol_json FROM turismo.vw_categorias_arbol;',
        [],
        'Obtener Árbol de Categorías (vw_categorias_arbol)',
      );
      return res.rows[0]?.arbol_json || [];
    } catch (err) {
      throw new HttpException(
        'Error al obtener árbol de categorías',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 2. Obtener Árbol de Actividades
  async getActivitiesTree(): Promise<ActivityItem[]> {
    this.totalRequests++;
    try {
      const res = await this.executeSql(
        'SELECT arbol_json FROM turismo.vw_actividades_arbol;',
        [],
        'Obtener Árbol de Actividades (vw_actividades_arbol)',
      );
      return res.rows[0]?.arbol_json || [];
    } catch (err) {
      throw new HttpException(
        'Error al obtener árbol de actividades',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 3. Obtener Lista de Departamentos
  async getDepartments(): Promise<any[]> {
    this.totalRequests++;
    try {
      const res = await this.executeSql(
        'SELECT id_departamento AS iddpto, nombre AS departamento, id_region FROM turismo.departamentos ORDER BY id_departamento;',
        [],
        'Obtener Departamentos (turismo.departamentos)',
      );
      return res.rows || [];
    } catch (err) {
      throw new HttpException(
        'Error al obtener departamentos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 4. Buscar Recursos Turísticos con Filtros SQL
  async searchResources(query: {
    search?: string;
    codigo?: number | string;
    department?: string;
    activity?: string;
    subactivity?: string;
    category?: string;
    type?: string;
    subtype?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ResourceItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.totalRequests++;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['r.is_active = TRUE'];
    const values: any[] = [];
    let paramIndex = 1;

    // Filtro por código exacto
    if (query.codigo) {
      const codNum = Number(query.codigo);
      if (codNum) {
        conditions.push(`r.codigo = $${paramIndex++}`);
        values.push(codNum);
      }
    }

    // Filtro por búsqueda de texto
    if (query.search && query.search.trim()) {
      const rawSearch = query.search.trim();
      if (/^\d+$/.test(rawSearch)) {
        const codNum = Number(rawSearch);
        conditions.push(
          `(r.codigo = $${paramIndex} OR public.unaccent(lower(r.nombre)) ILIKE '%' || public.unaccent(lower($${paramIndex + 1})) || '%')`,
        );
        values.push(codNum, rawSearch);
        paramIndex += 2;
      } else {
        conditions.push(
          `(public.unaccent(lower(r.nombre)) ILIKE '%' || public.unaccent(lower($${paramIndex})) || '%' OR public.unaccent(lower(r.departamento || ' ' || r.provincia || ' ' || r.distrito)) ILIKE '%' || public.unaccent(lower($${paramIndex})) || '%')`,
        );
        values.push(rawSearch);
        paramIndex++;
      }
    }

    // Filtro por departamento
    if (query.department && query.department.trim()) {
      const rawDept = query.department.trim();
      const depName = this.UBIGEO_DEP_MAP[rawDept] || rawDept;
      conditions.push(
        `public.unaccent(lower(r.departamento)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(depName);
    }

    // Filtro por categoría
    if (query.category && query.category.trim()) {
      conditions.push(
        `public.unaccent(lower(r.categoria)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(query.category.trim());
    }

    // Filtro por tipo de categoría
    if (query.type && query.type.trim()) {
      conditions.push(
        `public.unaccent(lower(r.tipo_categoria)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(query.type.trim());
    }

    // Filtro por subtipo
    if (query.subtype && query.subtype.trim()) {
      conditions.push(
        `public.unaccent(lower(r.subtipo_categoria)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(query.subtype.trim());
    }

    // Filtro por actividad / subactividad
    if (query.activity && query.activity.trim()) {
      const actParam = query.activity.trim();
      if (/^\d+$/.test(actParam)) {
        conditions.push(
          `EXISTS (SELECT 1 FROM turismo.ficha_actividades fa WHERE fa.recurso_codigo = r.codigo AND fa.id_actividad = $${paramIndex++})`,
        );
        values.push(Number(actParam));
      } else {
        conditions.push(
          `EXISTS (SELECT 1 FROM turismo.ficha_actividades fa WHERE fa.recurso_codigo = r.codigo AND public.unaccent(lower(fa.actividad)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%')`,
        );
        values.push(actParam);
      }
    }

    if (query.subactivity && query.subactivity.trim()) {
      const subParam = query.subactivity.trim();
      if (/^\d+$/.test(subParam)) {
        conditions.push(
          `EXISTS (SELECT 1 FROM turismo.ficha_actividades fa WHERE fa.recurso_codigo = r.codigo AND fa.id_subactividad = $${paramIndex++})`,
        );
        values.push(Number(subParam));
      } else {
        conditions.push(
          `EXISTS (SELECT 1 FROM turismo.ficha_actividades fa WHERE fa.recurso_codigo = r.codigo AND public.unaccent(lower(fa.tipo)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%')`,
        );
        values.push(subParam);
      }
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `SELECT count(*) AS total FROM turismo.vw_recursos_resumen r WHERE ${whereClause};`;
    const dataSql = `
      SELECT 
        r.codigo,
        r.nombre,
        r.categoria,
        r.tipo_categoria,
        r.subtipo_categoria,
        r.departamento,
        r.provincia,
        r.distrito,
        r.desdpto,
        r.desprov,
        r.desubigeo,
        r.x,
        r.y,
        r.coordenadas,
        r.url_ficha,
        r.url,
        r.jerarquia,
        r.desjerarquia,
        r.imagen,
        r.foto_url
      FROM turismo.vw_recursos_resumen r
      WHERE ${whereClause}
      ORDER BY r.codigo ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        this.executeSql(countSql, values, 'Buscar Recursos (Count Total)'),
        this.executeSql(dataSql, [...values, limit, offset], `Buscar Recursos (Pág. ${page}, Límite ${limit})`),
      ]);

      const total = Number(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (err) {
      throw new HttpException(
        'Error al realizar búsqueda de recursos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 5. Obtener Recursos Georreferenciados para OpenStreetMap
  async getMapResources(query: {
    department?: string;
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<ResourceItem[]> {
    this.totalRequests++;

    const conditions: string[] = [
      'r.is_active = TRUE',
      'r.x IS NOT NULL',
      'r.y IS NOT NULL',
    ];
    const values: any[] = [];
    let paramIndex = 1;

    if (query.department && query.department.trim()) {
      const rawDept = query.department.trim();
      const depName = this.UBIGEO_DEP_MAP[rawDept] || rawDept;
      conditions.push(
        `public.unaccent(lower(r.departamento)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(depName);
    }

    if (query.category && query.category.trim()) {
      conditions.push(
        `public.unaccent(lower(r.categoria)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(query.category.trim());
    }

    if (query.search && query.search.trim()) {
      conditions.push(
        `public.unaccent(lower(r.nombre)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(query.search.trim());
    }

    let limitClause = '';
    if (query.limit && Number(query.limit) > 0) {
      limitClause = `LIMIT $${paramIndex++}`;
      values.push(Number(query.limit));
    }

    const sql = `
      SELECT 
        r.codigo,
        r.nombre,
        r.categoria,
        r.tipo_categoria,
        r.subtipo_categoria,
        r.departamento,
        r.provincia,
        r.distrito,
        r.desdpto,
        r.desprov,
        r.desubigeo,
        r.x,
        r.y,
        r.coordenadas,
        r.url_ficha,
        r.url,
        r.jerarquia,
        r.desjerarquia,
        r.imagen,
        r.foto_url
      FROM turismo.vw_recursos_resumen r
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.codigo ASC
      ${limitClause};
    `;

    try {
      const res = await this.executeSql(sql, values, 'Obtener Recursos para Mapa');
      return res.rows;
    } catch (err) {
      throw new HttpException(
        'Error al obtener recursos para mapa',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 6. Obtener GeoJSON estándar para Leaflet / OpenStreetMap
  async getMapGeoJson(query: { department?: string; category?: string }) {
    this.totalRequests++;
    try {
      const dep = query.department?.trim()
        ? this.UBIGEO_DEP_MAP[query.department.trim()] || query.department.trim()
        : null;
      const cat = query.category?.trim() || null;

      const res = await this.executeSql(
        'SELECT turismo.fn_get_recursos_geojson($1, $2) AS geojson;',
        [dep, cat],
        'Obtener GeoJSON FeatureCollection (fn_get_recursos_geojson)',
      );

      return (
        res.rows[0]?.geojson || {
          type: 'FeatureCollection',
          features: [],
        }
      );
    } catch (err) {
      throw new HttpException(
        'Error al obtener mapa GeoJSON',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 7. Obtener Todos los Recursos Activos (Catálogo Completo)
  async getAllResources(): Promise<ResourceItem[]> {
    this.totalRequests++;
    try {
      const res = await this.executeSql(
        `
        SELECT 
          r.codigo,
          r.nombre,
          r.categoria,
          r.tipo_categoria,
          r.subtipo_categoria,
          r.departamento,
          r.provincia,
          r.distrito,
          r.desdpto,
          r.desprov,
          r.desubigeo,
          r.x,
          r.y,
          r.coordenadas,
          r.url_ficha,
          r.url,
          r.jerarquia,
          r.desjerarquia,
          r.imagen,
          r.foto_url
        FROM turismo.vw_recursos_resumen r
        WHERE r.is_active = TRUE
        ORDER BY r.codigo ASC;
        `,
        [],
        'Obtener Todos los Recursos Activos (Catálogo Completo)',
      );
      return res.rows;
    } catch (err) {
      throw new HttpException(
        'Error al obtener lista de recursos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 8. Obtener Recursos por Departamento
  async getResourcesByDepartment(dptoParam: string): Promise<ResourceItem[]> {
    this.totalRequests++;
    try {
      const depName = this.UBIGEO_DEP_MAP[dptoParam] || dptoParam;
      const res = await this.executeSql(
        `
        SELECT 
          r.codigo,
          r.nombre,
          r.categoria,
          r.tipo_categoria,
          r.subtipo_categoria,
          r.departamento,
          r.provincia,
          r.distrito,
          r.desdpto,
          r.desprov,
          r.desubigeo,
          r.x,
          r.y,
          r.coordenadas,
          r.url_ficha,
          r.url,
          r.jerarquia,
          r.desjerarquia,
          r.imagen,
          r.foto_url
        FROM turismo.vw_recursos_resumen r
        WHERE r.is_active = TRUE
          AND public.unaccent(lower(r.departamento)) ILIKE '%' || public.unaccent(lower($1)) || '%'
        ORDER BY r.codigo ASC;
        `,
        [depName],
        `Obtener Recursos por Departamento (${depName})`,
      );
      return res.rows;
    } catch (err) {
      throw new HttpException(
        'Error al obtener recursos por departamento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 9. Obtener Recursos Destacados Aleatorios con Fotos Verificadas
  async getFeaturedResources(query: {
    limit?: number;
    category?: string;
  }): Promise<ResourceItem[]> {
    this.totalRequests++;

    const limit = Math.max(1, Math.min(24, Number(query.limit) || 6));
    const conditions: string[] = [
      'r.is_active = TRUE',
      'r.imagen IS NOT NULL',
      "r.imagen <> ''",
    ];
    const values: any[] = [];
    let paramIndex = 1;

    if (query.category && query.category.trim()) {
      conditions.push(
        `public.unaccent(lower(r.categoria)) ILIKE '%' || public.unaccent(lower($${paramIndex++})) || '%'`,
      );
      values.push(query.category.trim());
    }

    const sql = `
      SELECT 
        r.codigo,
        r.nombre,
        r.categoria,
        r.tipo_categoria,
        r.subtipo_categoria,
        r.departamento,
        r.provincia,
        r.distrito,
        r.desdpto,
        r.desprov,
        r.desubigeo,
        r.x,
        r.y,
        r.coordenadas,
        r.url_ficha,
        r.url,
        r.jerarquia,
        r.desjerarquia,
        r.imagen,
        r.foto_url
      FROM turismo.vw_recursos_resumen r
      WHERE ${conditions.join(' AND ')}
      ORDER BY RANDOM()
      LIMIT $${paramIndex++};
    `;

    try {
      const res = await this.executeSql(
        sql,
        [...values, limit],
        `Obtener Recursos Destacados (Límite ${limit})`,
      );

      if (res.rows.length === 0 && query.category) {
        const fallbackRes = await this.executeSql(
          `
          SELECT 
            r.codigo,
            r.nombre,
            r.categoria,
            r.tipo_categoria,
            r.subtipo_categoria,
            r.departamento,
            r.provincia,
            r.distrito,
            r.desdpto,
            r.desprov,
            r.desubigeo,
            r.x,
            r.y,
            r.coordenadas,
            r.url_ficha,
            r.url,
            r.jerarquia,
            r.desjerarquia,
            r.imagen,
            r.foto_url
          FROM turismo.vw_recursos_resumen r
          WHERE r.is_active = TRUE
          ORDER BY RANDOM()
          LIMIT $1;
          `,
          [limit],
          'Obtener Destacados (Fallback)',
        );
        return fallbackRes.rows;
      }
      return res.rows;
    } catch (err) {
      throw new HttpException(
        'Error al obtener recursos destacados',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 10. Obtener Detalle de Ficha desde PostgreSQL
  async getFichaDetail(codFicha: number): Promise<FichaDetail> {
    this.totalRequests++;

    if (!codFicha || isNaN(codFicha)) {
      throw new HttpException(
        'El código de ficha proporcionado es inválido.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const res = await this.executeSql(
        'SELECT turismo.fn_get_ficha_detalle($1) AS ficha;',
        [codFicha],
        `Obtener Detalle Ficha N° ${codFicha} (fn_get_ficha_detalle)`,
      );

      const ficha = res.rows[0]?.ficha;

      if (!ficha || !ficha.cod_ficha) {
        throw new HttpException(
          `La ficha oficial N° ${codFicha} no existe en la base de datos nacional.`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Normalizar secciones para el frontend
      if (ficha.secciones && ficha.secciones.length > 0) {
        ficha.secciones = ficha.secciones.map((sec: any, idx: number) => ({
          id: sec.id || `sec_${idx}`,
          titulo: sec.titulo || '',
          contenido_texto: sec.contenido_texto || sec.contenido || '',
          contenido_html:
            sec.contenido_html ||
            `<p>${sec.contenido || sec.contenido_texto || ''}</p>`,
        }));
      }

      // Asegurar coordenadas x/y
      if (ficha.coordenadas) {
        ficha.x = ficha.coordenadas.longitud ?? ficha.x;
        ficha.y = ficha.coordenadas.latitud ?? ficha.y;
      }

      return ficha as FichaDetail;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error(
        `Error obteniendo ficha detalle ${codFicha}: ${err.message}`,
        err.stack,
      );
      throw new HttpException(
        'Error al consultar el detalle de la ficha turística',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 11. Redirección directa a la URL oficial de fotos
  getPhotoUrl(cod: string): string {
    return `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${cod}`;
  }
}
