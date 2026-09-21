import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as cheerio from 'cheerio';

export interface ActivityItem {
  id: number;
  codigo: string;
  atrac_acti: number;
  atrac_acti_tipo?: number | null;
  nombre: string;
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
  desprov?: string;
  desubigeo?: string;
  x?: number;
  y?: number;
  url?: string;
  desjerarquia?: string;
  imagen?: string;
  lstActiGeo?: any[];
  lstTipoActiGeo?: any[];
}

export interface FichaSection {
  id: string;
  titulo: string;
  contenido_texto: string;
  contenido_html: string;
}

export interface FichaActivity {
  actividad: string;
  tipo: string;
  observacion: string;
  icono_url?: string;
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
  google_maps_url?: string;
  foto_principal: string;
  galeria_fotos: string[];
  actividades_permitidas: string[];
  actividades_detalle?: FichaActivity[];
  rutas_acceso?: FichaRutaAcceso[];
  epoca_propicia?: FichaEpocaPropicia[];
  descripcion: string;
  particularidades?: string;
  estado_actual?: string;
  observaciones?: string;
  youtube_url?: string;
  youtube_id?: string;
  youtube_embed_url?: string;
  secciones?: FichaSection[];
}

@Injectable()
export class MinceturService implements OnModuleInit {
  private readonly logger = new Logger(MinceturService.name);
  private readonly http: AxiosInstance;

  private readonly BASE_URL = process.env.MINCETUR_BASE_URL || 'https://sigmincetur.mincetur.gob.pe/turismo';
  private readonly GEOSERVER_URL = process.env.GEOSERVER_URL || 'https://sigmincetur.mincetur.gob.pe/geoserver/ProduSig/ows';
  private readonly FICHA_BASE_URL = process.env.FICHA_BASE_URL || 'https://consultasenlinea.mincetur.gob.pe/fichaInventario';

  // 1. Memoria Caché de Alto Rendimiento con límite LRU (evita Memory Leaks)
  private readonly MAX_CACHE_ENTRIES = 5000;
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  // 2. Request Coalescing: Evita Cache Stampede (si miles de usuarios consultan a la vez, se ejecuta 1 sola promesa)
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  // Mapeo en memoria de Ficha -> ID de primera foto real
  private fichaToPhotoMap: Map<string, string> = new Map();

  // Mapeo de validación online de Fichas (evita fichas despublicadas o con 302)
  private onlineFichasCache: Map<string, boolean> = new Map();

  // Estadísticas para monitoreo y Load Balancers
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    startTime: Date.now(),
  };

  constructor() {
    this.http = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
        maxSockets: 200,
        maxFreeSockets: 50,
        keepAliveMsecs: 30000,
      }),
      timeout: 25000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/javascript, */*; q=0.01',
      },
    });
  }

  private readonly FALLBACK_RESOURCES: ResourceItem[] = [
    {
      codigo: 62,
      nombre: 'SANTUARIO HISTÓRICO DE MACHU PICCHU',
      categoria: 'SITIOS NATURALES',
      tipo_categoria: 'ÁREAS PROTEGIDAS',
      subtipo_categoria: 'SANTUARIO HISTÓRICO',
      desdpto: 'CUSCO',
      desprov: 'URUBAMBA',
      desubigeo: 'MACHUPICCHU',
      x: -72.544963,
      y: -13.163141,
      desjerarquia: 'Jerarquía 4',
      imagen: 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=62',
    },
    {
      codigo: 154,
      nombre: 'COMPLEJO ARQUEOLÓGICO DE SACSAYHUAMÁN',
      categoria: 'MANIFESTACIONES CULTURALES',
      tipo_categoria: 'SITIOS ARQUEOLÓGICOS',
      subtipo_categoria: 'EDIFICACIONES',
      desdpto: 'CUSCO',
      desprov: 'CUSCO',
      desubigeo: 'CUSCO',
      x: -71.9817,
      y: -13.5049,
      desjerarquia: 'Jerarquía 4',
      imagen: 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=154',
    },
    {
      codigo: 820,
      nombre: 'CAÑÓN DEL COLCA',
      categoria: 'SITIOS NATURALES',
      tipo_categoria: 'FENÓMENOS GEOLÓGICOS',
      subtipo_categoria: 'CAÑONES Y QUEBRADAS',
      desdpto: 'AREQUIPA',
      desprov: 'CAYLLOMA',
      desubigeo: 'CHIVAY',
      x: -71.8653,
      y: -15.6033,
      desjerarquia: 'Jerarquía 4',
      imagen: 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=820',
    },
    {
      codigo: 1205,
      nombre: 'RESERVA NACIONAL DE PARACAS',
      categoria: 'SITIOS NATURALES',
      tipo_categoria: 'ÁREAS PROTEGIDAS',
      subtipo_categoria: 'RESERVA NACIONAL',
      desdpto: 'ICA',
      desprov: 'PISCO',
      desubigeo: 'PARACAS',
      x: -76.2483,
      y: -13.8686,
      desjerarquia: 'Jerarquía 4',
      imagen: 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=1205',
    },
    {
      codigo: 450,
      nombre: 'LÍNEAS Y GEOGLIFOS DE NASCA',
      categoria: 'MANIFESTACIONES CULTURALES',
      tipo_categoria: 'SITIOS ARQUEOLÓGICOS',
      subtipo_categoria: 'GEOGLIFOS',
      desdpto: 'ICA',
      desprov: 'NASCA',
      desubigeo: 'NASCA',
      x: -74.9388,
      y: -14.7167,
      desjerarquia: 'Jerarquía 4',
      imagen: 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=450',
    },
    {
      codigo: 1980,
      nombre: 'COMPLEJO ARQUEOLÓGICO DE KUÉLAP',
      categoria: 'MANIFESTACIONES CULTURALES',
      tipo_categoria: 'SITIOS ARQUEOLÓGICOS',
      subtipo_categoria: 'FORTALEZAS',
      desdpto: 'AMAZONAS',
      desprov: 'LUYA',
      desubigeo: 'TINGO',
      x: -77.9238,
      y: -6.4239,
      desjerarquia: 'Jerarquía 4',
      imagen: 'https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=1980',
    },
  ];

  onModuleInit() {
    // Calentamiento asíncrono ordenado y seguro
    setTimeout(async () => {
      this.logger.log('Precargando catálogos base en memoria...');
      try {
        await this.getCategoriesTree();
        await this.getActivitiesTree();
        await this.getDepartments();
        this.logger.log('Catálogos base cargados exitosamente.');
      } catch (err) {
        this.logger.warn('Aviso: Carga inicial de catálogos usará respaldos optimizados');
      }
    }, 100);
  }

  getHealth() {
    return {
      status: 'healthy',
      uptimeSeconds: Math.floor((Date.now() - this.stats.startTime) / 1000),
      cacheSize: this.cache.size,
      maxCacheSize: this.MAX_CACHE_ENTRIES,
      stats: {
        totalRequests: this.stats.totalRequests,
        cacheHits: this.stats.cacheHits,
        cacheMisses: this.stats.cacheMisses,
        hitRatio: this.stats.totalRequests > 0 ? (this.stats.cacheHits / this.stats.totalRequests).toFixed(4) : '1.0000',
      },
      memoryUsage: process.memoryUsage(),
    };
  }

  private getFromCache<T>(key: string): T | null {
    this.stats.totalRequests++;
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) {
      this.stats.cacheHits++;
      return item.data as T;
    }
    this.stats.cacheMisses++;
    return null;
  }

  private setInCache(key: string, data: any, ttlMs: number = 600000) {
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      // Evict oldest 10%
      const keys = Array.from(this.cache.keys());
      for (let i = 0; i < Math.floor(this.MAX_CACHE_ENTRIES * 0.1); i++) {
        this.cache.delete(keys[i]);
      }
    }
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  // 1. Categorías normalizadas
  async getCategoriesTree(): Promise<any[]> {
    const cacheKey = 'categories_tree';
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const [resCat, resTipo, resSubTipo] = await Promise.all([
          this.http.get<any>(`${this.BASE_URL}/resource/js/json/atractivos.AT-Categoria.json`, { responseType: 'text' }),
          this.http.get<any>(`${this.BASE_URL}/resource/js/json/atractivos.AT-TipoCategria.json`, { responseType: 'text' }),
          this.http.get<any>(`${this.BASE_URL}/resource/js/json/atractivos.AT-SubTipoCategria.json`, { responseType: 'text' }),
        ]);

        const parseJson = (data: any) => {
          if (typeof data === 'string') {
            return JSON.parse(data.replace(/^\uFEFF/, '').trim());
          }
          return data;
        };

        const rawCategorias = parseJson(resCat.data);
        const rawTipos = parseJson(resTipo.data);
        const rawSubtipos = parseJson(resSubTipo.data);

        const subtiposPorTipo: Record<string, any[]> = {};
        for (const st of rawSubtipos) {
          const tipoId = String(st.COD_TIPO_CATE ?? st.atrac_tipo ?? st.tipo);
          if (!subtiposPorTipo[tipoId]) subtiposPorTipo[tipoId] = [];
          subtiposPorTipo[tipoId].push({
            atrac_stipo: st.COD_SUB_TIPO_CATE ?? st.atrac_stipo,
            subtipo_categoria: st.DES_SUB_TIPO_CATE ?? st.subtipo_categoria,
            atrac_tipo: st.COD_TIPO_CATE ?? st.atrac_tipo,
          });
        }

        const tiposPorCat: Record<string, any[]> = {};
        for (const t of rawTipos) {
          const catId = String(t.COD_CATEGORIA ?? t.atrac_categ ?? t.categoria);
          const tipoId = String(t.COD_TIPO_CATE ?? t.atrac_tipo ?? t.codigo);
          if (!tiposPorCat[catId]) tiposPorCat[catId] = [];
          tiposPorCat[catId].push({
            atrac_tipo: t.COD_TIPO_CATE ?? t.atrac_tipo,
            tipo_categoria: t.DES_TIPO_CATE ?? t.tipo_categoria,
            atrac_categ: t.COD_CATEGORIA ?? t.atrac_categ,
            subtipos: subtiposPorTipo[tipoId] || [],
          });
        }

        const result = rawCategorias.map((c: any) => {
          const catId = String(c.COD_CATEGORIA ?? c.atrac_categ ?? c.codigo);
          return {
            atrac_categ: c.COD_CATEGORIA ?? c.atrac_categ,
            categoria: c.DES_CATEGORIA ?? c.categoria,
            tipos: tiposPorCat[catId] || [],
          };
        });

        this.setInCache(cacheKey, result, 86400000);
        return result;
      } catch (error) {
        this.logger.error('Error fetching categories tree', error);
        const fallback = this.cache.get(cacheKey);
        if (fallback) return fallback.data;
        return [];
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  // 2. Actividades normalizadas
  async getActivitiesTree(): Promise<ActivityItem[]> {
    const cacheKey = 'activities_tree';
    const cached = this.getFromCache<ActivityItem[]>(cacheKey);
    if (cached) return cached;

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const response = await this.http.get<string>(`${this.BASE_URL}/resource/js/jquery-objects.js`, {
          responseType: 'text',
        });

        const match = response.data.match(/var\s+arrOpcionActividad\s*=\s*(\[.*?\])\s*;?\s*(?:var|$)/s);
        if (!match) {
          throw new Error('No se encontró arrOpcionActividad en jquery-objects.js');
        }

        let jsArray = match[1];
        jsArray = jsArray.replace(/(\b\w+\b)\s*:/g, '"$1":');
        jsArray = jsArray.replace(/,\s*([\]}])/g, '$1');

        const items: any[] = JSON.parse(jsArray);
        const catalogo: ActivityItem[] = [];
        const catMap: Record<number, ActivityItem> = {};

        for (const item of items) {
          if (item.num_nivel === 1) {
            const cat: ActivityItem = {
              id: item.id,
              codigo: item.codigo,
              atrac_acti: item.atrac_acti,
              nombre: item.tipocate_descrip,
              imagen: item.imagen ? `https://sigmincetur.mincetur.gob.pe${item.imagen}` : null,
              sub_actividades: [],
            };
            catalogo.push(cat);
            catMap[item.atrac_acti] = cat;
          } else if (item.num_nivel === 2) {
            const sub: ActivityItem = {
              id: item.id,
              codigo: item.codigo,
              atrac_acti: item.atrac_acti,
              atrac_acti_tipo: item.atrac_acti_tipo,
              nombre: item.tipocate_descrip,
              tipocate_codigo: item.tipocate_codigo,
              imagen: item.imagen ? `https://sigmincetur.mincetur.gob.pe${item.imagen}` : null,
            };
            const parent = catMap[item.atrac_acti];
            if (parent && parent.sub_actividades) {
              parent.sub_actividades.push(sub);
            }
          }
        }

        this.setInCache(cacheKey, catalogo, 86400000);
        return catalogo;
      } catch (error) {
        this.logger.error('Error fetching activities tree', error);
        const fallback = this.cache.get(cacheKey);
        if (fallback) return fallback.data;
        return [];
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  // 3. Departamentos normalizados
  async getDepartments(): Promise<any[]> {
    const cacheKey = 'departments_list';
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const fallbackList = [
      { iddpto: '01', departamento: 'AMAZONAS' },
      { iddpto: '02', departamento: 'ANCASH' },
      { iddpto: '03', departamento: 'APURIMAC' },
      { iddpto: '04', departamento: 'AREQUIPA' },
      { iddpto: '05', departamento: 'AYACUCHO' },
      { iddpto: '06', departamento: 'CAJAMARCA' },
      { iddpto: '07', departamento: 'CALLAO' },
      { iddpto: '08', departamento: 'CUSCO' },
      { iddpto: '09', departamento: 'HUANCAVELICA' },
      { iddpto: '10', departamento: 'HUANUCO' },
      { iddpto: '11', departamento: 'ICA' },
      { iddpto: '12', departamento: 'JUNIN' },
      { iddpto: '13', departamento: 'LA LIBERTAD' },
      { iddpto: '14', departamento: 'LAMBAYEQUE' },
      { iddpto: '15', departamento: 'LIMA' },
      { iddpto: '16', departamento: 'LORETO' },
      { iddpto: '17', departamento: 'MADRE DE DIOS' },
      { iddpto: '18', departamento: 'MOQUEGUA' },
      { iddpto: '19', departamento: 'PASCO' },
      { iddpto: '20', departamento: 'PIURA' },
      { iddpto: '21', departamento: 'PUNO' },
      { iddpto: '22', departamento: 'SAN MARTIN' },
      { iddpto: '23', departamento: 'TACNA' },
      { iddpto: '24', departamento: 'TUMBES' },
      { iddpto: '25', departamento: 'UCAYALI' },
    ];

    try {
      const response = await this.http.get(this.GEOSERVER_URL, {
        params: {
          service: 'WFS',
          version: '1.0.0',
          request: 'GetFeature',
          typeName: 'ProduSig:ubigeo.Departamentos',
          outputFormat: 'application/json',
        },
        timeout: 4000,
      });

      if (response.data && response.data.features && response.data.features.length > 0) {
        const list = response.data.features.map((f: any) => {
          const p = f.properties || {};
          return {
            iddpto: String(p.CODREGION ?? p.iddpto ?? p.idregion ?? '').padStart(2, '0'),
            departamento: String(p.NOMBRE ?? p.departamento ?? p.desdpto ?? '').toUpperCase(),
          };
        }).filter((d: any) => d.iddpto && d.departamento);

        if (list.length > 0) {
          this.setInCache(cacheKey, list, 86400000);
          return list;
        }
      }
    } catch (error) {
      // Fallback
    }

    this.setInCache(cacheKey, fallbackList, 86400000);
    return fallbackList;
  }

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
    '12': 'JUNÍN',
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

  private readonly ACTIVITY_CQL_MAP: Record<string, string> = {
    '1': "(id_categoria1 = 1 OR id_categoria1 = 2)",
    '16': "(des_categoria2 LIKE '%AGUA%' OR des_categoria3 LIKE '%PLAYA%' OR des_categoria3 LIKE '%RIO%' OR des_categoria3 LIKE '%LAGUNA%' OR des_categoria3 LIKE '%LAGO%' OR des_categoria3 LIKE '%MAR%')",
    '30': "(id_categoria1 = 1 OR des_categoria1 LIKE '%NATURAL%')",
    '35': "(id_categoria1 = 3 OR des_categoria1 LIKE '%FOLK%' OR id_categoria1 = 2)",
    '43': "(des_categoria3 LIKE '%MONTAÑA%' OR des_categoria3 LIKE '%NEVADO%' OR des_categoria3 LIKE '%QUEBRADA%' OR des_categoria3 LIKE '%CAÑON%' OR des_categoria3 LIKE '%BOSQUE%' OR des_categoria2 LIKE '%GEOL%')",
    '63': "(id_categoria1 = 4 OR id_categoria1 = 5 OR des_categoria1 LIKE '%ARTÍSTICA%')",
  };

  // 4. Buscar Recursos Turísticos con Paginación Ultra-Rápida en Servidor (GeoServer WFS / CQL)
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
  }): Promise<{ data: ResourceItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const startIndex = (page - 1) * limit;

    const cacheKey = `search_v3_${JSON.stringify({ ...query, page, limit })}`;
    const cached = this.getFromCache<{ data: ResourceItem[]; total: number; page: number; limit: number; totalPages: number }>(cacheKey);
    if (cached) return cached;

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      // Motor de alta velocidad permanente (GeoServer WFS ProduSig:SIG1GEOIRT)
      try {
        const cqlFilters: string[] = [];

        // 0. Filtro por código exacto de recurso
        if (query.codigo) {
          const codNum = Number(query.codigo);
          if (!isNaN(codNum)) {
            cqlFilters.push(`cod_reg = '${codNum}'`);
          }
        } else {
          // Filtrar únicamente fichas publicadas y verificadas oficialmente (excluye borradores 'Por jerarquizar' que no tienen ficha pública)
          cqlFilters.push("des_jerarquia <> 'Por jerarquizar' AND des_jerarquia IS NOT NULL");
        }

        // 1. Filtro por término de búsqueda (soporta nombre, ubicación o código numérico)
        if (query.search && query.search.trim()) {
          const rawSearch = query.search.trim();
          const sanitized = rawSearch.replace(/['"\\]/g, '').toUpperCase();
          if (/^\d+$/.test(rawSearch)) {
            cqlFilters.push(
              `(cod_reg = '${rawSearch}' OR des_nombre LIKE '%${sanitized}%' OR des_provincia LIKE '%${sanitized}%' OR des_distrito LIKE '%${sanitized}%' OR des_region LIKE '%${sanitized}%')`
            );
          } else {
            cqlFilters.push(
              `(des_nombre LIKE '%${sanitized}%' OR des_provincia LIKE '%${sanitized}%' OR des_distrito LIKE '%${sanitized}%' OR des_region LIKE '%${sanitized}%')`
            );
          }
        }

        // 2. Filtro por departamento / región
        if (query.department && query.department.trim()) {
          const rawDept = query.department.trim();
          const depName = (this.UBIGEO_DEP_MAP[rawDept] || rawDept).replace(/['"\\]/g, '').trim().toUpperCase();
          if (depName === 'JUNIN' || depName === 'JUNÍN') {
            cqlFilters.push("des_region LIKE '%JUN%N%'");
          } else {
            cqlFilters.push(`des_region LIKE '%${depName}%'`);
          }
        }

        // 3. Filtro por actividad (mapeo directo ultra-rápido)
        if (query.activity && query.activity.trim()) {
          const actId = query.activity.trim();
          const actCql = this.ACTIVITY_CQL_MAP[actId];
          if (actCql) {
            cqlFilters.push(actCql);
          }
        }

        // 4. Filtro por subactividad
        if (query.subactivity && query.subactivity.trim()) {
          const sanitizedSub = query.subactivity.replace(/['"\\]/g, '').trim().toUpperCase();
          if (!/^\d+$/.test(sanitizedSub)) {
            cqlFilters.push(`(des_nombre LIKE '%${sanitizedSub}%' OR des_categoria3 LIKE '%${sanitizedSub}%')`);
          }
        }

        // 5. Filtro por categoría
        if (query.category && query.category.trim()) {
          const cat = query.category.trim();
          if (/^\d+$/.test(cat)) {
            cqlFilters.push(`id_categoria1 = ${cat}`);
          } else {
            const sanitized = cat.replace(/['"\\]/g, '').toUpperCase();
            cqlFilters.push(`des_categoria1 LIKE '%${sanitized}%'`);
          }
        }

        // 6. Filtro por tipo
        if (query.type && query.type.trim()) {
          const sanitized = query.type.replace(/['"\\]/g, '').trim().toUpperCase();
          cqlFilters.push(`des_categoria2 LIKE '%${sanitized}%'`);
        }

        // 7. Filtro por subtipo
        if (query.subtype && query.subtype.trim()) {
          const sanitized = query.subtype.replace(/['"\\]/g, '').trim().toUpperCase();
          cqlFilters.push(`des_categoria3 LIKE '%${sanitized}%'`);
        }

        const cqlString = cqlFilters.length > 0 ? cqlFilters.join(' AND ') : undefined;

        // Ejecutar en paralelo: Consulta paginada + Conteo total exacto (resultType=hits)
        const [dataRes, hitsRes] = await Promise.all([
          this.http.get(this.GEOSERVER_URL, {
            params: {
              service: 'WFS',
              version: '1.0.0',
              request: 'GetFeature',
              typeName: 'ProduSig:SIG1GEOIRT',
              maxFeatures: limit,
              startIndex: startIndex,
              CQL_FILTER: cqlString,
              outputFormat: 'application/json',
            },
            timeout: 5000,
          }),
          this.http.get(this.GEOSERVER_URL, {
            params: {
              service: 'WFS',
              version: '1.1.0',
              request: 'GetFeature',
              typeName: 'ProduSig:SIG1GEOIRT',
              CQL_FILTER: cqlString,
              resultType: 'hits',
            },
            timeout: 5000,
          }),
        ]);

        let total = 0;
        if (typeof hitsRes.data === 'string') {
          const match = hitsRes.data.match(/numberOfFeatures="(\d+)"/);
          if (match) total = parseInt(match[1], 10);
        }

        const features = dataRes.data?.features || [];
        if (!total && features.length > 0) {
          total = features.length;
        }

        const items: ResourceItem[] = features.map((feat: any) => {
          const p = feat.properties || {};
          const cod = Number(p.cod_reg) || 0;
          const coords = feat.geometry?.coordinates || [];

          return {
            codigo: cod,
            nombre: p.des_nombre || 'Recurso Turístico',
            categoria: (p.des_categoria1 || '').replace(/^\d+\.\s*/, ''),
            tipo_categoria: p.des_categoria2 || '',
            subtipo_categoria: p.des_categoria3 || '',
            desdpto: p.des_region || '',
            desprov: p.des_provincia || '',
            desubigeo: p.des_distrito || '',
            x: coords[0] ?? null,
            y: coords[1] ?? null,
            url: p.des_web || `${this.FICHA_BASE_URL}/index.aspx?cod_Ficha=${cod}`,
            desjerarquia: p.des_jerarquia || '',
            imagen: `/api/photos/${cod}`,
          };
        });

        // Escaneo y validación concurrente en paralelo: solo incluir fichas activas online y resolver sus fotos
        const verifiedItems: ResourceItem[] = [];
        await Promise.allSettled(
          items.map(async (item) => {
            if (item.codigo) {
              const [isOnline, photoId] = await Promise.all([
                this.isFichaOnline(item.codigo),
                this.resolveFichaPhotoId(item.codigo),
              ]);
              if (isOnline) {
                if (photoId) {
                  item.imagen = `/api/photos/${photoId}`;
                }
                verifiedItems.push(item);
              }
            }
          })
        );

        // Si se encontraron elementos verificados en esta página, usar verifiedItems
        let finalItems = verifiedItems.length > 0 ? verifiedItems : items;

        // Si se buscó por código específico y no se encontró en GeoServer, intentar consultar la ficha oficial directamente
        const targetCod = query.codigo || (query.search && /^\d+$/.test(query.search.trim()) ? query.search.trim() : null);
        if (targetCod && finalItems.length === 0) {
          try {
            const codNum = Number(targetCod);
            const ficha = await this.getFichaDetail(codNum);
            if (ficha && ficha.nombre) {
              finalItems = [
                {
                  codigo: ficha.cod_ficha,
                  nombre: ficha.nombre,
                  categoria: ficha.categoria,
                  tipo_categoria: ficha.tipo,
                  subtipo_categoria: ficha.subtipo,
                  desdpto: ficha.departamento,
                  desprov: ficha.provincia,
                  desubigeo: ficha.distrito,
                  desjerarquia: ficha.jerarquia,
                  imagen: ficha.foto_principal,
                  url: ficha.url_ficha,
                },
              ];
              total = 1;
            }
          } catch {
            // Ficha no encontrada
          }
        }

        const totalPages = Math.ceil(total / limit) || 1;
        const result = {
          data: finalItems,
          total: targetCod && finalItems.length > 0 ? finalItems.length : total,
          page,
          limit,
          totalPages: targetCod && finalItems.length > 0 ? 1 : totalPages,
        };

        this.setInCache(cacheKey, result, 600000);
        return result;
      } catch (error) {
        this.logger.error(`Error en consulta WFS MINCETUR: ${error.message}`);
        const fallback = this.FALLBACK_RESOURCES.slice(startIndex, startIndex + limit);
        return {
          data: fallback,
          total: this.FALLBACK_RESOURCES.length,
          page,
          limit,
          totalPages: Math.ceil(this.FALLBACK_RESOURCES.length / limit) || 1,
        };
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  // 5. Extraer Ficha Oficial de Inventario Detallada con todas las Secciones
  async getFichaDetail(codFicha: number): Promise<FichaDetail> {
    const cacheKey = `ficha_${codFicha}`;
    const cached = this.getFromCache<FichaDetail>(cacheKey);
    if (cached) return cached;

    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const url = `${this.FICHA_BASE_URL}/index.aspx?cod_Ficha=${codFicha}`;
        const response = await this.http.get<string>(url, {
          responseType: 'text',
          timeout: 8000,
          maxRedirects: 0,
          validateStatus: (status) => status === 200,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            Referer: `${this.FICHA_BASE_URL}/`,
          },
        });
        const html = response.data;
        if (!html || html.includes('Object moved') || html.length < 500) {
          throw new HttpException(
            `La ficha oficial N° ${codFicha} no existe o ha sido dada de baja del inventario oficial.`,
            HttpStatus.NOT_FOUND,
          );
        }
        const $ = cheerio.load(html);

        const detalle: FichaDetail = {
          cod_ficha: codFicha,
          url_ficha: url,
          nombre: $('.TituloRecurso').text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || '',
          departamento: '',
          provincia: '',
          distrito: '',
          categoria: '',
          tipo: '',
          subtipo: '',
          jerarquia: '',
          altitud: '',
          foto_principal: '',
          galeria_fotos: [],
          actividades_permitidas: [],
          descripcion: $('meta[property="og:description"]').attr('content')?.trim() || '',
          particularidades: '',
          estado_actual: '',
          observaciones: '',
          secciones: [],
        };

        $('table tr').each((_, el) => {
          const text = $(el).text();
          const value = $(el).find('span.TextGris, span.TextGris2').text().trim();
          if (text.includes('Departamento:')) detalle.departamento = value;
          if (text.includes('Provincia:')) detalle.provincia = value;
          if (text.includes('Distrito:')) detalle.distrito = value;
          if (text.includes('Categoría:')) detalle.categoria = value;
          if (text.includes('Tipo:')) detalle.tipo = value;
          if (text.includes('Subtipo:')) detalle.subtipo = value;
          if (text.includes('Jerarquía:')) detalle.jerarquia = value;
          if (text.includes('Altitud:')) detalle.altitud = value;
        });

        // Extraer fotos y mapear la primera foto real de la ficha
        const fotosSet = new Set<string>();
        const photoIds: string[] = [];
        $('a[href*="foto.aspx?cod="], img[src*="foto.aspx?cod="]').each((_, el) => {
          const href = $(el).attr('href') || $(el).attr('src') || '';
          const match = href.match(/foto\.aspx\?cod=(\d+)/);
          if (match && match[1] && match[1] !== String(codFicha)) {
            fotosSet.add(`/api/photos/${match[1]}`);
            if (!photoIds.includes(match[1])) {
              photoIds.push(match[1]);
            }
          }
        });
        detalle.galeria_fotos = Array.from(fotosSet);
        if (photoIds.length > 0) {
          this.fichaToPhotoMap.set(String(codFicha), photoIds[0]);
          detalle.foto_principal = `/api/photos/${photoIds[0]}`;
        } else {
          detalle.foto_principal = `/api/photos/${codFicha}`;
        }

        // Extraer Actividades Desarrolladas con iconos oficiales de la tabla
        const actividades_detalle: FichaActivity[] = [];
        $('#accordionContent h3').each((_, el) => {
          const title = $(el).text().toLowerCase();
          if (title.includes('actividades desarrolladas') || title.includes('actividades')) {
            const div = $(el).next('div');
            div.find('table tr').each((rIdx, row) => {
              if (rIdx === 0) return; // Skip encabezado
              const tds = $(row).find('td');
              if (tds.length >= 3) {
                const actividad = $(tds[0]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
                const tipo = $(tds[1]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
                const observacion = $(tds[2]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');

                let icono_url = '';
                if (tds.length >= 4) {
                  const img = $(tds[3]).find('img');
                  let src = img.attr('src') || '';
                  if (src && !src.includes('vineta')) {
                    if (!src.startsWith('http')) {
                      src = `${this.FICHA_BASE_URL}/${src.replace(/^\/+/, '')}`;
                    }
                    icono_url = src.replace(/([^:])\/\/+/g, '$1/');
                  }
                }
                if (actividad || tipo) {
                  actividades_detalle.push({ actividad, tipo, observacion, icono_url });
                }
              }
            });
          }
        });
        detalle.actividades_detalle = actividades_detalle;

        // Extraer Rutas de Acceso estructuradas
        const rutas_acceso: FichaRutaAcceso[] = [];
        $('#accordionContent h3').each((_, el) => {
          const title = $(el).text().toLowerCase();
          if (title.includes('ruta de acceso') || title.includes('acceso')) {
            const div = $(el).next('div');
            div.find('table tr').each((rIdx, row) => {
              if (rIdx === 0) return;
              const tds = $(row).find('td');
              if (tds.length >= 6) {
                rutas_acceso.push({
                  recorrido: $(tds[0]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  tramo: $(tds[1]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  detalle: $(tds[2]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  tipo_acceso: $(tds[3]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  medio_transporte: $(tds[4]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  tipo_via: $(tds[5]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  distancia_tiempo: tds.length >= 7 ? $(tds[6]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ') : '',
                });
              } else if (tds.length >= 4) {
                rutas_acceso.push({
                  recorrido: $(tds[0]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  tramo: $(tds[1]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  detalle: $(tds[2]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  tipo_acceso: $(tds[3]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  medio_transporte: tds.length >= 5 ? $(tds[4]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ') : '',
                  tipo_via: tds.length >= 6 ? $(tds[5]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ') : '',
                  distancia_tiempo: tds.length >= 7 ? $(tds[6]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ') : '',
                });
              }
            });
          }
        });
        detalle.rutas_acceso = rutas_acceso;

        // Extraer Época Propicia estructurada
        const epoca_propicia: FichaEpocaPropicia[] = [];
        $('#accordionContent h3').each((_, el) => {
          const title = $(el).text().toLowerCase();
          if (title.includes('epoca propicia') || title.includes('época propicia')) {
            const div = $(el).next('div');
            div.find('table tr').each((rIdx, row) => {
              if (rIdx === 0) return;
              const tds = $(row).find('td');
              if (tds.length >= 2) {
                epoca_propicia.push({
                  epoca: $(tds[0]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' '),
                  especificacion: tds.length >= 2 ? $(tds[1]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ') : '',
                  horario: tds.length >= 3 ? $(tds[2]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ') : '',
                  observaciones: tds.length >= 4 ? $(tds[3]).text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ') : '',
                });
              }
            });
          }
        });
        detalle.epoca_propicia = epoca_propicia;

        $('td img[title]').each((_, el) => {
          const title = $(el).attr('title')?.trim();
          if (title && !detalle.actividades_permitidas.includes(title)) {
            detalle.actividades_permitidas.push(title);
          }
        });

        // Buscar enlace a YouTube en todo el HTML o en los enlaces y texto
        const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
        const ytMatch = html.match(ytRegex);
        if (ytMatch && ytMatch[1]) {
          detalle.youtube_id = ytMatch[1];
          detalle.youtube_url = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
          detalle.youtube_embed_url = `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        // Extraer únicamente las 5 secciones requeridas:
        // 1. Descripción
        // 2. Ruta de acceso
        // 3. Época propicia
        // 4. Actividades desarrolladas
        // 5. Datos del responsable
        const headers: string[] = [];
        $('#accordionContent h3').each((_, el) => {
          headers.push($(el).text().trim());
        });

        const sectionDivs: any[] = [];
        $('#accordionContent > div').each((_, el) => {
          sectionDivs.push($(el));
        });

        const allowedKeywords = [
          'descripción',
          'descripcion',
          'ruta de acceso',
          'época propicia',
          'epoca propicia',
          'actividades desarrolladas',
          'datos del responsable',
          'responsable'
        ];

        headers.forEach((title, idx) => {
          const lowerTitle = title.toLowerCase();
          const isAllowed = allowedKeywords.some((kw) => lowerTitle.includes(kw));

          if (!isAllowed) return;

          const div = sectionDivs[idx];
          if (div && div.length > 0) {
            div.find('script, style').remove();
            
            // Buscar si dentro de esta sección hay un link de YouTube que no se haya capturado
            const secHtml = div.html() || '';
            if (!detalle.youtube_id) {
              const secYtMatch = secHtml.match(ytRegex);
              if (secYtMatch && secYtMatch[1]) {
                detalle.youtube_id = secYtMatch[1];
                detalle.youtube_url = `https://www.youtube.com/watch?v=${secYtMatch[1]}`;
                detalle.youtube_embed_url = `https://www.youtube.com/embed/${secYtMatch[1]}`;
              }
            }

            const text = div.text().trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');

            if ((lowerTitle.includes('descripción') || lowerTitle.includes('descripcion')) && text) {
              detalle.descripcion = text;
              return; // Evita duplicar la descripción en detalle.secciones
            }

            if (
              lowerTitle.includes('ruta de acceso') ||
              lowerTitle.includes('acceso') ||
              lowerTitle.includes('epoca propicia') ||
              lowerTitle.includes('época propicia') ||
              lowerTitle.includes('actividades') ||
              lowerTitle.includes('responsable')
            ) {
              return; // Ya procesado en arrays estructurados o no requerido
            }

            // Normalizar título limpio sin MINCETUR
            let cleanTitle = title.replace(/MINCETUR/gi, '').trim();
            if (!cleanTitle) cleanTitle = title;

            detalle.secciones?.push({
              id: `sec_${idx}`,
              titulo: cleanTitle,
              contenido_texto: text,
              contenido_html: secHtml,
            });
          }
        });

        // Buscar coordenadas en recursos cacheados/fallback
        const matchedResource = this.FALLBACK_RESOURCES.find((r) => r.codigo === codFicha);
        if (matchedResource?.x && matchedResource?.y) {
          detalle.x = matchedResource.x;
          detalle.y = matchedResource.y;
          detalle.google_maps_url = `https://www.google.com/maps?q=${matchedResource.y},${matchedResource.x}`;
        } else {
          const locQuery = `${detalle.nombre}, ${detalle.distrito ? detalle.distrito + ', ' : ''}${detalle.provincia ? detalle.provincia + ', ' : ''}${detalle.departamento ? detalle.departamento + ', ' : ''}Peru`;
          detalle.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locQuery)}`;
        }

        this.setInCache(cacheKey, detalle, 86400000);
        return detalle;
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        this.logger.warn(`Ficha ${codFicha} no disponible o no publicada: ${error.message}`);
        throw new HttpException(`La ficha oficial N° ${codFicha} no existe en el inventario oficial.`, HttpStatus.NOT_FOUND);
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  // 5.1 Validar si una ficha está publicada online en el inventario oficial
  async isFichaOnline(codFicha: number | string): Promise<boolean> {
    const key = String(codFicha);
    if (this.onlineFichasCache.has(key)) {
      return this.onlineFichasCache.get(key) ?? false;
    }

    try {
      const fichaUrl = `${this.FICHA_BASE_URL}/index.aspx?cod_Ficha=${codFicha}`;
      const res = await this.http.get<string>(fichaUrl, {
        timeout: 2500,
        responseType: 'text',
        maxRedirects: 0,
        validateStatus: (status) => status === 200,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: `${this.FICHA_BASE_URL}/`,
        },
      });

      const isOnline = Boolean(res.data && res.data.length > 500 && !res.data.includes('Object moved'));
      this.onlineFichasCache.set(key, isOnline);
      return isOnline;
    } catch {
      this.onlineFichasCache.set(key, false);
      return false;
    }
  }

  // 6. Resolver ID de foto real a partir del HTML de la ficha
  async resolveFichaPhotoId(codFicha: number | string): Promise<string | null> {
    const key = String(codFicha);
    if (this.fichaToPhotoMap.has(key)) {
      return this.fichaToPhotoMap.get(key) || null;
    }

    try {
      const fichaUrl = `${this.FICHA_BASE_URL}/index.aspx?cod_Ficha=${codFicha}`;
      const res = await this.http.get<string>(fichaUrl, {
        timeout: 3000,
        responseType: 'text',
        maxRedirects: 0,
        validateStatus: (status) => status === 200,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: `${this.FICHA_BASE_URL}/`,
        },
      });
      const html = res.data;
      if (!html || html.length < 500 || html.includes('Object moved')) {
        this.onlineFichasCache.set(key, false);
        return null;
      }
      this.onlineFichasCache.set(key, true);

      const $ = cheerio.load(html);
      let photoId: string | null = null;

      // 1. Extraer de la foto principal del encabezado (.img-section)
      $('.img-section a, .img-section img').each((_, el) => {
        const src = $(el).attr('href') || $(el).attr('src') || '';
        const match = src.match(/foto\.aspx\?cod=(\d+)/);
        if (match && match[1] && match[1] !== key) {
          photoId = match[1];
          return false; // break
        }
      });

      // 2. Si no, buscar en la galería del accordion o lightbox
      if (!photoId) {
        $('#accordionContent a, #accordionContent img, a[data-lightbox], img[src*="foto.aspx"]').each((_, el) => {
          const src = $(el).attr('href') || $(el).attr('src') || '';
          const match = src.match(/foto\.aspx\?cod=(\d+)/);
          if (match && match[1] && match[1] !== key) {
            photoId = match[1];
            return false; // break
          }
        });
      }

      // 3. Si aún no, cualquier ocurrencia de foto.aspx?cod=(\d+)
      if (!photoId) {
        const allMatches = html.match(/foto\.aspx\?cod=(\d+)/g);
        if (allMatches) {
          for (const m of allMatches) {
            const idM = m.match(/cod=(\d+)/);
            if (idM && idM[1] && idM[1] !== key) {
              photoId = idM[1];
              break;
            }
          }
        }
      }

      if (photoId) {
        this.fichaToPhotoMap.set(key, photoId);
        return photoId;
      }
    } catch (err) {
      // Ignorar timeout o 302 silenciosamente
    }

    return null;
  }

  // 7. Proxy Inteligente de Fotos: Resuelve automáticamente el ID de foto real si la ficha usa ID diferente
  async getPhotoStream(cod: string): Promise<{ stream: any; contentType: string }> {
    let targetPhotoId = this.fichaToPhotoMap.get(String(cod)) || String(cod);

    // Si el código no está mapeado y es posible que sea un código de ficha (ej: < 100000)
    if (!this.fichaToPhotoMap.has(String(cod)) && Number(cod) < 100000) {
      const resolved = await this.resolveFichaPhotoId(cod);
      if (resolved) {
        targetPhotoId = resolved;
      }
    }

    // Intento 1: Descargar imagen por ID de foto
    try {
      const url = `${this.FICHA_BASE_URL}/foto.aspx?cod=${targetPhotoId}`;
      const response = await this.http.get(url, {
        responseType: 'stream',
        timeout: 5000,
        validateStatus: (status) => status < 400,
      });

      const contentType = String(response.headers['content-type'] || '');
      if (contentType.includes('image')) {
        return {
          stream: response.data,
          contentType: contentType || 'image/jpeg',
        };
      }
    } catch (err) {
      // Si falló, intentar re-resolver
    }

    // Intento 2: Si targetPhotoId no funcionó, forzar resolución desde la ficha
    try {
      const resolved = await this.resolveFichaPhotoId(cod);
      if (resolved && resolved !== targetPhotoId) {
        const retryUrl = `${this.FICHA_BASE_URL}/foto.aspx?cod=${resolved}`;
        const retryRes = await this.http.get(retryUrl, {
          responseType: 'stream',
          timeout: 5000,
        });

        return {
          stream: retryRes.data,
          contentType: String(retryRes.headers['content-type'] || 'image/jpeg'),
        };
      }
    } catch (err) {
      this.logger.warn(`No se pudo descargar foto para código ${cod}: ${err.message}`);
    }

    throw new HttpException('Imagen no encontrada', HttpStatus.NOT_FOUND);
  }
}
