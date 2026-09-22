import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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
  servicios_turisticos?: Array<{ ubicacion: string; instalacion?: string; servicio?: string; tipo_servicio?: string; observacion?: string }>;
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
export class MinceturService implements OnModuleInit {
  private readonly logger = new Logger(MinceturService.name);

  // Rutas base a la base de datos local JSON
  private readonly DB_DIR = path.resolve(
    process.env.MINCETUR_DATA_DIR || path.join(__dirname, '../../db/mincetur'),
  );
  private readonly CATALOGOS_DIR = path.join(this.DB_DIR, 'catalogos');
  private readonly RECURSOS_DIR = path.join(this.DB_DIR, 'recursos');
  private readonly FICHAS_DIR = path.join(this.DB_DIR, 'fichas');
  private readonly FICHAS_INDIV_DIR = path.join(this.FICHAS_DIR, 'individuales');

  // Cache en memoria para rendimiento instantáneo (< 1ms)
  private categoriesCache: any[] | null = null;
  private activitiesCache: ActivityItem[] | null = null;
  private departmentsCache: any[] | null = null;
  private resourcesCache: ResourceItem[] | null = null;
  private offlineCodesSet: Set<number> = new Set<number>();
  private fichaToPhotoMap: Map<number, string> = new Map<number, string>();

  // Estadísticas para monitoreo
  private stats = {
    totalRequests: 0,
    startTime: Date.now(),
  };

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

  constructor() {}

  onModuleInit() {
    this.logger.log(`Iniciando repositorio de datos JSON desde: ${this.DB_DIR}`);
    this.loadOfflineCodes();
    this.loadCatalogsIntoMemory();
    this.loadFichasPhotosMap();
    this.loadResourcesIntoMemory();
  }

  private loadOfflineCodes() {
    const offlinePath = path.join(this.FICHAS_DIR, 'offline_codes.json');
    if (fs.existsSync(offlinePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(offlinePath, 'utf-8'));
        if (Array.isArray(raw)) {
          this.offlineCodesSet = new Set<number>(raw.map((c: any) => Number(c)));
          this.logger.log(`Cargados ${this.offlineCodesSet.size} códigos de fichas offline/retiradas.`);
        }
      } catch (err) {
        this.logger.warn(`No se pudo leer offline_codes.json: ${err.message}`);
      }
    }
  }

  private loadCatalogsIntoMemory() {
    // 1. Categorías
    const catFile = path.join(this.CATALOGOS_DIR, 'categorias_arbol.json');
    if (fs.existsSync(catFile)) {
      try {
        this.categoriesCache = JSON.parse(fs.readFileSync(catFile, 'utf-8'));
      } catch (e) {
        this.logger.error(`Error cargando categorías: ${e.message}`);
      }
    }

    // 2. Actividades
    const actFile = path.join(this.CATALOGOS_DIR, 'actividades_arbol.json');
    if (fs.existsSync(actFile)) {
      try {
        this.activitiesCache = JSON.parse(fs.readFileSync(actFile, 'utf-8'));
      } catch (e) {
        this.logger.error(`Error cargando actividades: ${e.message}`);
      }
    }

    // 3. Departamentos
    const depFile = path.join(this.CATALOGOS_DIR, 'departamentos.json');
    if (fs.existsSync(depFile)) {
      try {
        this.departmentsCache = JSON.parse(fs.readFileSync(depFile, 'utf-8'));
      } catch (e) {
        this.logger.error(`Error cargando departamentos: ${e.message}`);
      }
    }
  }

  // Pre-indexa en memoria la URL web directa de la foto de cada ficha
  private loadFichasPhotosMap() {
    if (!fs.existsSync(this.FICHAS_INDIV_DIR)) return;

    try {
      const files = fs.readdirSync(this.FICHAS_INDIV_DIR);
      for (const file of files) {
        if (!file.startsWith('ficha_') || !file.endsWith('.json')) continue;
        const codStr = file.replace('ficha_', '').replace('.json', '');
        const codNum = Number(codStr);
        if (!codNum) continue;

        try {
          const filePath = path.join(this.FICHAS_INDIV_DIR, file);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);

          const photoUrl = data.foto_principal || (data.galeria_fotos && data.galeria_fotos[0]);
          if (photoUrl && photoUrl.startsWith('http')) {
            this.fichaToPhotoMap.set(codNum, photoUrl);
          }
        } catch (e) {
          // Ignorar
        }
      }

      this.logger.log(`Mapeadas ${this.fichaToPhotoMap.size} URLs de fotos oficiales en memoria.`);
    } catch (e) {
      this.logger.warn(`No se pudo indexar mapa de fotos: ${e.message}`);
    }
  }

  private loadResourcesIntoMemory() {
    const resFile = path.join(this.RECURSOS_DIR, 'recursos_resumen.json');
    if (fs.existsSync(resFile)) {
      try {
        const raw: any[] = JSON.parse(fs.readFileSync(resFile, 'utf-8'));
        this.resourcesCache = raw
          .filter((r: any) => {
            const cod = Number(r.codigo);
            // Excluir fichas dadas de baja / redirecciones registradas en offline_codes.json
            return cod && !this.offlineCodesSet.has(cod);
          })
          .map((r: any) => {
            const lat = r.coordenadas?.latitud ?? r.y ?? null;
            const lon = r.coordenadas?.longitud ?? r.x ?? null;
            const cod = Number(r.codigo);

            // Obtener URL web directa de la foto o dejar null
            const directPhotoUrl = this.fichaToPhotoMap.get(cod) || null;

            return {
              codigo: cod,
              nombre: r.nombre || `Recurso N° ${cod}`,
              categoria: r.categoria || '',
              tipo_categoria: r.tipo_categoria || '',
              subtipo_categoria: r.subtipo_categoria || '',
              desdpto: r.departamento || r.desdpto || '',
              departamento: r.departamento || r.desdpto || '',
              desprov: r.provincia || r.desprov || '',
              provincia: r.provincia || r.desprov || '',
              desubigeo: r.distrito || r.desubigeo || '',
              distrito: r.distrito || r.desubigeo || '',
              x: lon,
              y: lat,
              coordenadas: {
                latitud: lat,
                longitud: lon,
              },
              url: r.url_ficha || r.url || `https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=${cod}`,
              url_ficha: r.url_ficha || `https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=${cod}`,
              desjerarquia: r.jerarquia || r.desjerarquia || '',
              jerarquia: r.jerarquia || r.desjerarquia || '',
              imagen: directPhotoUrl,
              foto_url: directPhotoUrl || r.foto_url,
            };
          });

        this.logger.log(`Base de datos de recursos verificados: ${this.resourcesCache.length} recursos turísticos activos cargados en memoria.`);
      } catch (e) {
        this.logger.error(`Error indexando recursos: ${e.message}`);
      }
    }
  }

  getHealth() {
    return {
      status: 'healthy',
      storage: 'local_json_db',
      dbPath: this.DB_DIR,
      uptimeSeconds: Math.floor((Date.now() - this.stats.startTime) / 1000),
      totalRequests: this.stats.totalRequests,
      totalResourcesLoaded: this.resourcesCache?.length || 0,
      totalCategoriesLoaded: this.categoriesCache?.length || 0,
      totalFichasWithPhotos: this.fichaToPhotoMap.size,
      totalOfflineCodes: this.offlineCodesSet.size,
      memoryUsage: process.memoryUsage(),
    };
  }

  // 1. Obtener Árbol de Categorías
  async getCategoriesTree(): Promise<any[]> {
    this.stats.totalRequests++;
    if (this.categoriesCache) return this.categoriesCache;
    this.loadCatalogsIntoMemory();
    return this.categoriesCache || [];
  }

  // 2. Obtener Árbol de Actividades
  async getActivitiesTree(): Promise<ActivityItem[]> {
    this.stats.totalRequests++;
    if (this.activitiesCache) return this.activitiesCache;
    this.loadCatalogsIntoMemory();
    return this.activitiesCache || [];
  }

  // 3. Obtener Lista de Departamentos
  async getDepartments(): Promise<any[]> {
    this.stats.totalRequests++;
    if (this.departmentsCache) return this.departmentsCache;
    this.loadCatalogsIntoMemory();
    return this.departmentsCache || [];
  }

  // 4. Buscar Recursos Turísticos con Filtros en Memoria
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
    this.stats.totalRequests++;

    if (!this.resourcesCache) {
      this.loadResourcesIntoMemory();
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const startIndex = (page - 1) * limit;

    let filtered = this.resourcesCache || [];

    // 0. Filtro por código exacto
    if (query.codigo) {
      const codNum = Number(query.codigo);
      filtered = filtered.filter((r) => r.codigo === codNum);
    }

    // 1. Filtro por búsqueda de texto
    if (query.search && query.search.trim()) {
      const rawSearch = query.search.trim();
      const normQuery = normalizeText(rawSearch);

      if (/^\d+$/.test(rawSearch)) {
        const targetCod = Number(rawSearch);
        filtered = filtered.filter((r) => r.codigo === targetCod || normalizeText(r.nombre).includes(normQuery));
      } else {
        const queryTokens = normQuery.split(/\s+/).filter(Boolean);
        filtered = filtered.filter((r) => {
          const normName = normalizeText(r.nombre);
          const normDpto = normalizeText(r.desdpto);
          const normProv = normalizeText(r.desprov);
          const normDist = normalizeText(r.desubigeo);
          const fullText = `${normName} ${normDpto} ${normProv} ${normDist}`;

          const matchesFull = fullText.includes(normQuery);
          const matchesAllTokens = queryTokens.length > 1 && queryTokens.every((token) => fullText.includes(token));

          return matchesFull || matchesAllTokens;
        });
      }
    }

    // 2. Filtro por departamento
    if (query.department && query.department.trim()) {
      const rawDept = query.department.trim();
      const depName = this.UBIGEO_DEP_MAP[rawDept] || rawDept;
      const normDep = normalizeText(depName);
      filtered = filtered.filter((r) => {
        const d = normalizeText(r.desdpto);
        if (normDep.includes('junin')) return d.includes('jun');
        return d.includes(normDep);
      });
    }

    // 3. Filtro por categoría
    if (query.category && query.category.trim()) {
      const normCat = normalizeText(query.category);
      filtered = filtered.filter((r) => normalizeText(r.categoria).includes(normCat));
    }

    // 4. Filtro por tipo de categoría
    if (query.type && query.type.trim()) {
      const normTp = normalizeText(query.type);
      filtered = filtered.filter((r) => normalizeText(r.tipo_categoria).includes(normTp));
    }

    // 5. Filtro por subtipo
    if (query.subtype && query.subtype.trim()) {
      const normSub = normalizeText(query.subtype);
      filtered = filtered.filter((r) => normalizeText(r.subtipo_categoria).includes(normSub));
    }

    // 6. Filtro por actividad
    if (query.activity && query.activity.trim()) {
      const actId = query.activity.trim();
      if (actId === '1') {
        filtered = filtered.filter((r) => {
          const normCat = normalizeText(r.categoria);
          return normCat.includes('natural') || normCat.includes('cultural');
        });
      } else if (actId === '16') {
        filtered = filtered.filter((r) => {
          const combined = normalizeText(`${r.tipo_categoria} ${r.subtipo_categoria} ${r.nombre}`);
          return (
            combined.includes('agua') ||
            combined.includes('playa') ||
            combined.includes('rio') ||
            combined.includes('laguna') ||
            combined.includes('lago') ||
            combined.includes('mar')
          );
        });
      } else if (actId === '30') {
        filtered = filtered.filter((r) => normalizeText(r.categoria).includes('natural'));
      } else if (actId === '35') {
        filtered = filtered.filter((r) => {
          const normCat = normalizeText(r.categoria);
          return normCat.includes('folk') || normCat.includes('cultural');
        });
      } else if (actId === '43') {
        filtered = filtered.filter((r) => {
          const combined = normalizeText(`${r.subtipo_categoria} ${r.tipo_categoria} ${r.nombre}`);
          return (
            combined.includes('montana') ||
            combined.includes('nevado') ||
            combined.includes('quebrada') ||
            combined.includes('canon') ||
            combined.includes('bosque') ||
            combined.includes('geol')
          );
        });
      } else if (actId === '63') {
        filtered = filtered.filter((r) => {
          const normCat = normalizeText(r.categoria);
          return (
            normCat.includes('contempor') ||
            normCat.includes('artistica') ||
            normCat.includes('evento')
          );
        });
      }
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginatedItems,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // 5. Obtener Recursos Georreferenciados para OpenStreetMap
  async getMapResources(query: {
    department?: string;
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<ResourceItem[]> {
    this.stats.totalRequests++;

    if (!this.resourcesCache) {
      this.loadResourcesIntoMemory();
    }

    let filtered = (this.resourcesCache || []).filter(
      (r) => r.coordenadas?.latitud != null && r.coordenadas?.longitud != null,
    );

    // Filtro por departamento
    if (query.department && query.department.trim()) {
      const rawDept = query.department.trim();
      const depName = this.UBIGEO_DEP_MAP[rawDept] || rawDept;
      const normDep = normalizeText(depName);
      filtered = filtered.filter((r) => {
        const d = normalizeText(r.desdpto);
        if (normDep.includes('junin')) return d.includes('jun');
        return d.includes(normDep);
      });
    }

    // Filtro por categoría
    if (query.category && query.category.trim()) {
      const normCat = normalizeText(query.category);
      filtered = filtered.filter((r) => normalizeText(r.categoria).includes(normCat));
    }

    // Filtro por búsqueda
    if (query.search && query.search.trim()) {
      const normQuery = normalizeText(query.search);
      filtered = filtered.filter((r) => normalizeText(r.nombre).includes(normQuery));
    }

    if (query.limit && Number(query.limit) > 0) {
      return filtered.slice(0, Number(query.limit));
    }

    return filtered;
  }

  // 6. Obtener GeoJSON estándar para Leaflet / OpenStreetMap
  async getMapGeoJson(query: { department?: string; category?: string }) {
    const resources = await this.getMapResources(query);

    return {
      type: 'FeatureCollection',
      features: resources.map((r) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [r.coordenadas?.longitud, r.coordenadas?.latitud],
        },
        properties: {
          codigo: r.codigo,
          nombre: r.nombre,
          categoria: r.categoria,
          tipo_categoria: r.tipo_categoria,
          subtipo_categoria: r.subtipo_categoria,
          departamento: r.desdpto,
          provincia: r.desprov,
          distrito: r.desubigeo,
          jerarquia: r.jerarquia,
          imagen: r.imagen,
          url_ficha: r.url_ficha,
        },
      })),
    };
  }

  // 7. Obtener Todos los Recursos Activos (Catálogo Completo)
  async getAllResources(): Promise<ResourceItem[]> {
    this.stats.totalRequests++;
    if (!this.resourcesCache) {
      this.loadResourcesIntoMemory();
    }
    return this.resourcesCache || [];
  }

  // 8. Obtener Recursos por Departamento
  async getResourcesByDepartment(dptoParam: string): Promise<ResourceItem[]> {
    this.stats.totalRequests++;
    if (!this.resourcesCache) {
      this.loadResourcesIntoMemory();
    }

    const depName = this.UBIGEO_DEP_MAP[dptoParam] || dptoParam;
    const normDep = normalizeText(depName);

    return (this.resourcesCache || []).filter((r) => {
      const d = normalizeText(r.desdpto);
      if (normDep.includes('junin')) return d.includes('jun');
      return d.includes(normDep);
    });
  }

  // 9. Obtener Recursos Destacados Aleatorios (Random 6) con Fotos Verificadas
  async getFeaturedResources(query: { limit?: number; category?: string }): Promise<ResourceItem[]> {
    this.stats.totalRequests++;

    if (!this.resourcesCache) {
      this.loadResourcesIntoMemory();
    }

    const limit = Math.max(1, Math.min(24, Number(query.limit) || 6));
    let pool = (this.resourcesCache || []).filter((r) => Boolean(r.imagen || this.fichaToPhotoMap.has(r.codigo)));

    if (query.category && query.category.trim()) {
      const normCat = normalizeText(query.category);
      pool = pool.filter((r) => normalizeText(r.categoria).includes(normCat));
    }

    // Si por el filtro de categoría no hay con foto, usar pool general filtrado
    if (pool.length === 0) {
      pool = this.resourcesCache || [];
      if (query.category && query.category.trim()) {
        const normCat = normalizeText(query.category);
        pool = pool.filter((r) => normalizeText(r.categoria).includes(normCat));
      }
    }

    // Shuffle aleatorio (Fisher-Yates) para que cada consulta devuelva destinos distintos
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, limit);
  }

  // 6. Obtener Detalle de Ficha desde JSON Local
  async getFichaDetail(codFicha: number): Promise<FichaDetail> {
    this.stats.totalRequests++;

    if (this.offlineCodesSet.has(codFicha)) {
      throw new HttpException(
        `La ficha oficial N° ${codFicha} no está disponible o ha sido dada de baja del inventario oficial.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const fichaPath = path.join(this.FICHAS_INDIV_DIR, `ficha_${codFicha}.json`);

    // 1. Si existe la ficha técnica completa en disco, devolverla
    if (fs.existsSync(fichaPath)) {
      try {
        const raw = fs.readFileSync(fichaPath, 'utf-8');
        const parsed: FichaDetail = JSON.parse(raw);

        // Normalizar secciones para el frontend
        if (parsed.secciones && parsed.secciones.length > 0) {
          parsed.secciones = parsed.secciones.map((sec: any, idx: number) => ({
            id: sec.id || `sec_${idx}`,
            titulo: sec.titulo || '',
            contenido_texto: sec.contenido_texto || sec.contenido || '',
            contenido_html: sec.contenido_html || `<p>${sec.contenido || sec.contenido_texto || ''}</p>`,
          }));
        }

        // Asegurar coordenadas x/y
        if (parsed.coordenadas) {
          parsed.x = parsed.coordenadas.longitud ?? parsed.x;
          parsed.y = parsed.coordenadas.latitud ?? parsed.y;
        }

        return parsed;
      } catch (err) {
        this.logger.error(`Error leyendo ficha ${codFicha}: ${err.message}`);
      }
    }

    // 2. Si no tiene ficha HTML descargada pero existe en el catálogo maestro
    const matchedRec = this.resourcesCache?.find((r) => r.codigo === codFicha);
    if (matchedRec) {
      const photoUrl = this.fichaToPhotoMap.get(codFicha) || null;

      const dpto = matchedRec.departamento || matchedRec.desdpto || 'Perú';
      const prov = matchedRec.provincia || matchedRec.desprov || '';
      const dist = matchedRec.distrito || matchedRec.desubigeo || '';

      const lat = matchedRec.y ?? matchedRec.coordenadas?.latitud;
      const lon = matchedRec.x ?? matchedRec.coordenadas?.longitud;

      return {
        cod_ficha: codFicha,
        url_ficha: matchedRec.url_ficha || `https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=${codFicha}`,
        nombre: matchedRec.nombre,
        departamento: dpto,
        provincia: prov,
        distrito: dist,
        categoria: matchedRec.categoria || 'Recurso Turístico',
        tipo: matchedRec.tipo_categoria || '',
        subtipo: matchedRec.subtipo_categoria || '',
        jerarquia: matchedRec.jerarquia || matchedRec.desjerarquia || 'En evaluación',
        altitud: '',
        x: lon,
        y: lat,
        coordenadas: {
          latitud: lat,
          longitud: lon,
        },
        google_maps_url: lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${matchedRec.nombre}, ${dpto} Peru`)}`,
        foto_principal: photoUrl,
        galeria_fotos: photoUrl ? [photoUrl] : [],
        actividades_permitidas: [],
        actividades_detalle: [],
        rutas_acceso: [],
        epoca_propicia: [],
        descripcion: `Atractivo turístico registrado en el Inventario Nacional de Recursos Turísticos del Perú. Ubicado en el departamento de ${dpto}${prov ? `, provincia de ${prov}` : ''}${dist ? `, distrito de ${dist}` : ''}. Categoría: ${matchedRec.categoria || 'Turismo Nacional'}${matchedRec.tipo_categoria ? ` > ${matchedRec.tipo_categoria}` : ''}${matchedRec.subtipo_categoria ? ` > ${matchedRec.subtipo_categoria}` : ''}.`,
        secciones: [],
      };
    }

    throw new HttpException(
      `La ficha oficial N° ${codFicha} no existe en la base de datos nacional.`,
      HttpStatus.NOT_FOUND,
    );
  }

  // 7. Redirección directa a la URL oficial de fotos con resolución exacta de ID de foto
  getPhotoUrl(cod: string): string {
    const codNum = Number(cod);
    if (codNum && this.fichaToPhotoMap.has(codNum)) {
      return this.fichaToPhotoMap.get(codNum)!;
    }
    return `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${cod}`;
  }
}
