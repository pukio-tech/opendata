import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import {
  CatalogsResponse,
  EmpresaItem,
  EmpresaListItem,
  EmpresasQueryParams,
  EmpresasStatsResponse,
  EmpresaSuggestion,
  PaginatedEmpresasResponse,
} from './interfaces/empresa.interface';

@Injectable()
export class EmpresasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmpresasService.name);
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
      connectionTimeoutMillis: 5000,
    });
  }

  async onModuleInit() {
    try {
      const res = await this.pool.query('SELECT COUNT(*) FROM empresas.empresas');
      this.logger.log(
        `[EmpresasService] Conexión establecida con Neon DB. Empresas registradas: ${res.rows[0].count}`,
      );
    } catch (err: any) {
      this.logger.error(
        `[EmpresasService] Error al conectar con Neon DB: ${err.message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Búsqueda y listado paginado con filtros avanzados
   */
  async searchEmpresas(params: EmpresasQueryParams): Promise<PaginatedEmpresasResponse> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['e.is_active = TRUE'];
    const values: any[] = [];
    let paramIndex = 1;

    // Filtro por búsqueda de texto (RUC, Razón Social o Nombre Comercial)
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      // Si el término es puramente numérico, priorizamos búsqueda por RUC
      if (/^\d+$/.test(searchTerm)) {
        conditions.push(`(e.numero_documento LIKE $${paramIndex} OR e.numero_documento = $${paramIndex + 1})`);
        values.push(`${searchTerm}%`, searchTerm);
        paramIndex += 2;
      } else {
        conditions.push(
          `(e.razon_social ILIKE $${paramIndex} OR e.nombre_comercial ILIKE $${paramIndex} OR e.numero_documento ILIKE $${paramIndex})`,
        );
        values.push(`%${searchTerm}%`);
        paramIndex += 1;
      }
    }

    // Filtro directo por RUC
    if (params.ruc && params.ruc.trim()) {
      conditions.push(`e.numero_documento = $${paramIndex}`);
      values.push(params.ruc.trim());
      paramIndex += 1;
    }

    // Filtro por Departamento
    if (params.departamento && params.departamento.trim()) {
      conditions.push(`UPPER(e.departamento) = UPPER($${paramIndex})`);
      values.push(params.departamento.trim());
      paramIndex += 1;
    }

    // Filtro por Provincia
    if (params.provincia && params.provincia.trim()) {
      conditions.push(`UPPER(e.provincia) = UPPER($${paramIndex})`);
      values.push(params.provincia.trim());
      paramIndex += 1;
    }

    // Filtro por Distrito
    if (params.distrito && params.distrito.trim()) {
      conditions.push(`UPPER(e.distrito) = UPPER($${paramIndex})`);
      values.push(params.distrito.trim());
      paramIndex += 1;
    }

    // Filtro por Estado (ACTIVO, BAJA, etc.)
    if (params.estado && params.estado.trim()) {
      conditions.push(`UPPER(e.estado_contribuyente) = UPPER($${paramIndex})`);
      values.push(params.estado.trim());
      paramIndex += 1;
    }

    // Filtro por Condición de Domicilio (HABIDO, NO HABIDO, etc.)
    if (params.condicion && params.condicion.trim()) {
      conditions.push(`UPPER(e.condicion_domicilio) = UPPER($${paramIndex})`);
      values.push(params.condicion.trim());
      paramIndex += 1;
    }

    // Filtro por CIIU
    if (params.ciiu && params.ciiu.trim()) {
      conditions.push(`e.codigo_ciiu = $${paramIndex}`);
      values.push(params.ciiu.trim());
      paramIndex += 1;
    }

    // Filtro por Tipo de Contribuyente
    if (params.tipo && params.tipo.trim()) {
      conditions.push(`UPPER(e.tipo_contribuyente) = UPPER($${paramIndex})`);
      values.push(params.tipo.trim());
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Ordenamiento
    let orderClause = 'ORDER BY e.id_contribuyente ASC';
    if (params.sortBy === 'recent') {
      orderClause = 'ORDER BY e.fecha_inicio_actividades DESC NULLS LAST, e.id_contribuyente DESC';
    } else if (params.sortBy === 'name') {
      const order = params.sortOrder === 'desc' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY e.razon_social ${order}`;
    } else if (params.sortBy === 'ruc') {
      const order = params.sortOrder === 'desc' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY e.numero_documento ${order}`;
    }

    // Consulta de conteo total
    const countSql = `SELECT COUNT(*) FROM empresas.empresas e ${whereClause};`;
    const countRes = await this.pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    // Consulta de datos paginados
    const dataSql = `
      SELECT 
        e.id_contribuyente,
        e.numero_documento AS ruc,
        e.razon_social,
        COALESCE(NULLIF(e.nombre_comercial, '-'), NULL) AS nombre_comercial,
        e.estado_contribuyente,
        e.condicion_domicilio,
        e.tipo_contribuyente,
        e.codigo_ciiu,
        e.actividad_economica,
        e.codigo_ubigeo,
        e.departamento,
        e.provincia,
        e.distrito,
        e.direccion,
        TO_CHAR(e.fecha_inicio_actividades, 'YYYY-MM-DD') AS fecha_inicio_actividades,
        e.url_empresa
      FROM empresas.empresas e
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    const dataRes = await this.pool.query(dataSql, [...values, limit, offset]);

    return {
      success: true,
      data: dataRes.rows as EmpresaListItem[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Obtiene una empresa por su RUC o número de documento
   */
  async getEmpresaByRuc(ruc: string): Promise<EmpresaItem> {
    const cleanRuc = ruc.trim();
    const query = `
      SELECT 
        id_contribuyente,
        tipo_documento,
        numero_documento,
        razon_social,
        nombre_comercial,
        estado_contribuyente,
        condicion_domicilio,
        tipo_contribuyente,
        actividad_economica,
        codigo_ciiu,
        TO_CHAR(fecha_inscripcion, 'YYYY-MM-DD') AS fecha_inscripcion,
        TO_CHAR(fecha_inicio_actividades, 'YYYY-MM-DD') AS fecha_inicio_actividades,
        TO_CHAR(fecha_baja, 'YYYY-MM-DD') AS fecha_baja,
        url_empresa,
        codigo_ubigeo,
        direccion,
        departamento,
        provincia,
        distrito,
        dni,
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
        correo_electronico,
        sitio_web,
        fecha_actualizacion_fuente,
        fecha_creacion_fuente,
        fecha_creacion,
        fecha_actualizacion
      FROM empresas.empresas
      WHERE numero_documento = $1 AND is_active = TRUE
      LIMIT 1;
    `;
    const res = await this.pool.query(query, [cleanRuc]);

    if (!res.rows || res.rows.length === 0) {
      throw new NotFoundException(`No se encontró ninguna empresa con el RUC: ${cleanRuc}`);
    }

    return res.rows[0] as EmpresaItem;
  }

  /**
   * Obtiene una empresa por su slug / URL amigable
   */
  async getEmpresaBySlug(slug: string): Promise<EmpresaItem> {
    const cleanSlug = slug.trim().toLowerCase();
    const query = `
      SELECT 
        id_contribuyente,
        tipo_documento,
        numero_documento,
        razon_social,
        nombre_comercial,
        estado_contribuyente,
        condicion_domicilio,
        tipo_contribuyente,
        actividad_economica,
        codigo_ciiu,
        TO_CHAR(fecha_inscripcion, 'YYYY-MM-DD') AS fecha_inscripcion,
        TO_CHAR(fecha_inicio_actividades, 'YYYY-MM-DD') AS fecha_inicio_actividades,
        TO_CHAR(fecha_baja, 'YYYY-MM-DD') AS fecha_baja,
        url_empresa,
        codigo_ubigeo,
        direccion,
        departamento,
        provincia,
        distrito,
        dni,
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
        correo_electronico,
        sitio_web,
        fecha_actualizacion_fuente,
        fecha_creacion_fuente,
        fecha_creacion,
        fecha_actualizacion
      FROM empresas.empresas
      WHERE url_empresa = $1 AND is_active = TRUE
      LIMIT 1;
    `;
    const res = await this.pool.query(query, [cleanSlug]);

    if (!res.rows || res.rows.length === 0) {
      throw new NotFoundException(`No se encontró ninguna empresa con el slug: ${cleanSlug}`);
    }

    return res.rows[0] as EmpresaItem;
  }

  /**
   * Autocompletado rápido para buscador del frontend
   */
  async getSuggestions(query: string, limit = 8): Promise<EmpresaSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim();
    const cleanLimit = Math.min(20, Math.max(1, limit));

    let sql: string;
    let values: any[];

    if (/^\d+$/.test(cleanQuery)) {
      sql = `
        SELECT 
          numero_documento AS ruc,
          razon_social,
          nombre_comercial,
          departamento,
          actividad_economica,
          url_empresa
        FROM empresas.empresas
        WHERE numero_documento LIKE $1 AND is_active = TRUE
        ORDER BY numero_documento ASC
        LIMIT $2;
      `;
      values = [`${cleanQuery}%`, cleanLimit];
    } else {
      sql = `
        SELECT 
          numero_documento AS ruc,
          razon_social,
          nombre_comercial,
          departamento,
          actividad_economica,
          url_empresa
        FROM empresas.empresas
        WHERE (razon_social ILIKE $1 OR nombre_comercial ILIKE $1) AND is_active = TRUE
        ORDER BY 
          CASE WHEN razon_social ILIKE $2 THEN 1 ELSE 2 END,
          razon_social ASC
        LIMIT $3;
      `;
      values = [`%${cleanQuery}%`, `${cleanQuery}%`, cleanLimit];
    }

    const res = await this.pool.query(sql, values);
    return res.rows as EmpresaSuggestion[];
  }

  /**
   * Estadísticas y KPIs del dataset para dashboard en el frontend
   */
  async getStats(): Promise<EmpresasStatsResponse> {
    const [totalesRes, deptosRes, actRes, tiposRes] = await Promise.all([
      this.pool.query(`
        SELECT 
          COUNT(*) AS total_empresas,
          COUNT(*) FILTER (WHERE estado_contribuyente = 'ACTIVO') AS total_activas,
          COUNT(*) FILTER (WHERE condicion_domicilio = 'HABIDO') AS total_habidas
        FROM empresas.empresas
        WHERE is_active = TRUE;
      `),
      this.pool.query(`
        SELECT 
          departamento, 
          total_empresas, 
          total_activas 
        FROM empresas.vw_estadisticas_departamento 
        LIMIT 10;
      `),
      this.pool.query(`
        SELECT 
          codigo_ciiu, 
          actividad_economica, 
          total_empresas 
        FROM empresas.vw_top_actividades 
        LIMIT 10;
      `),
      this.pool.query(`
        SELECT 
          COALESCE(tipo_contribuyente, 'OTRO') AS tipo_contribuyente,
          COUNT(*) AS total_empresas
        FROM empresas.empresas
        WHERE is_active = TRUE
        GROUP BY tipo_contribuyente
        ORDER BY total_empresas DESC
        LIMIT 10;
      `),
    ]);

    const totales = totalesRes.rows[0];
    const totalEmpresas = parseInt(totales.total_empresas, 10) || 0;
    const totalActivas = parseInt(totales.total_activas, 10) || 0;
    const totalHabidas = parseInt(totales.total_habidas, 10) || 0;

    return {
      total_empresas: totalEmpresas,
      total_activas: totalActivas,
      total_habidas: totalHabidas,
      porcentaje_activas: totalEmpresas > 0 ? Number(((totalActivas / totalEmpresas) * 100).toFixed(2)) : 0,
      top_departamentos: deptosRes.rows.map((r) => ({
        departamento: r.departamento,
        total_empresas: parseInt(r.total_empresas, 10),
        total_activas: parseInt(r.total_activas, 10),
      })),
      top_actividades: actRes.rows.map((r) => ({
        codigo_ciiu: r.codigo_ciiu,
        actividad_economica: r.actividad_economica,
        total_empresas: parseInt(r.total_empresas, 10),
      })),
      distribucion_tipos: tiposRes.rows.map((r) => ({
        tipo_contribuyente: r.tipo_contribuyente,
        total_empresas: parseInt(r.total_empresas, 10),
      })),
    };
  }

  /**
   * Catálogos para selectors / filtros del frontend
   */
  async getCatalogs(): Promise<CatalogsResponse> {
    const [deptosRes, actRes, tiposRes] = await Promise.all([
      this.pool.query(`
        SELECT departamento, COUNT(*) AS total
        FROM empresas.empresas
        WHERE departamento IS NOT NULL AND is_active = TRUE
        GROUP BY departamento
        ORDER BY total DESC;
      `),
      this.pool.query(`
        SELECT codigo_ciiu, actividad_economica, COUNT(*) AS total
        FROM empresas.empresas
        WHERE codigo_ciiu IS NOT NULL AND is_active = TRUE
        GROUP BY codigo_ciiu, actividad_economica
        ORDER BY total DESC
        LIMIT 50;
      `),
      this.pool.query(`
        SELECT tipo_contribuyente, COUNT(*) AS total
        FROM empresas.empresas
        WHERE tipo_contribuyente IS NOT NULL AND is_active = TRUE
        GROUP BY tipo_contribuyente
        ORDER BY total DESC;
      `),
    ]);

    return {
      departamentos: deptosRes.rows.map((r) => ({
        departamento: r.departamento,
        total: parseInt(r.total, 10),
      })),
      actividades: actRes.rows.map((r) => ({
        codigo_ciiu: r.codigo_ciiu,
        actividad_economica: r.actividad_economica,
        total: parseInt(r.total, 10),
      })),
      tipos_contribuyente: tiposRes.rows.map((r) => ({
        tipo_contribuyente: r.tipo_contribuyente,
        total: parseInt(r.total, 10),
      })),
      estados: ['ACTIVO', 'BAJA DE OFICIO', 'SUSPENSION TEMPORAL'],
      condiciones: ['HABIDO', 'NO HABIDO', 'NO HALLADO', 'PENDIENTE'],
    };
  }
}
