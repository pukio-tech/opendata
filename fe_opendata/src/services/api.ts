import { ActivityItem, CategoryItem, DepartmentItem, FichaDetail, PaginatedResponse, ResourceItem } from '../types/mincetur';
import { PapaCronogramaResponse } from '../types/papa';
import localPapaData from '../data/cronograma_papa_leonxiv.json';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getPhotoUrl = (codigo: number | string) =>
  `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${codigo}`;

// Cache en memoria en el cliente para navegación instantánea
const clientCache = new Map<string, { data: any; expiry: number }>();
const inFlightClientRequests = new Map<string, Promise<any>>();

const getCached = <T>(key: string): T | null => {
  const item = clientCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  return null;
};

const setCached = (key: string, data: any, ttlMs: number = 600000) => {
  clientCache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
};

export const apiService = {
  // 1. Obtener categorías con caché
  async getCategories(): Promise<CategoryItem[]> {
    const key = 'categories';
    const cached = getCached<CategoryItem[]>(key);
    if (cached) return cached;

    if (inFlightClientRequests.has(key)) {
      return inFlightClientRequests.get(key);
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (!res.ok) throw new Error('Error al cargar categorías');
        const data = await res.json();
        setCached(key, data, 86400000);
        return data;
      } catch (e) {
        console.error(e);
        return [];
      } finally {
        inFlightClientRequests.delete(key);
      }
    })();

    inFlightClientRequests.set(key, promise);
    return promise;
  },

  async getCategoriesTree(): Promise<CategoryItem[]> {
    return this.getCategories();
  },

  // 2. Obtener actividades con caché
  async getActivities(): Promise<ActivityItem[]> {
    const key = 'activities';
    const cached = getCached<ActivityItem[]>(key);
    if (cached) return cached;

    if (inFlightClientRequests.has(key)) {
      return inFlightClientRequests.get(key);
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/activities`);
        if (!res.ok) throw new Error('Error al cargar actividades');
        const data = await res.json();
        setCached(key, data, 86400000);
        return data;
      } catch (e) {
        console.error(e);
        return [];
      } finally {
        inFlightClientRequests.delete(key);
      }
    })();

    inFlightClientRequests.set(key, promise);
    return promise;
  },

  async getActivitiesTree(): Promise<ActivityItem[]> {
    return this.getActivities();
  },

  // 3. Obtener departamentos con caché
  async getDepartments(): Promise<DepartmentItem[]> {
    const key = 'departments';
    const cached = getCached<DepartmentItem[]>(key);
    if (cached) return cached;

    if (inFlightClientRequests.has(key)) {
      return inFlightClientRequests.get(key);
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/departments`);
        if (!res.ok) throw new Error('Error al cargar departamentos');
        const data = await res.json();
        setCached(key, data, 86400000);
        return data;
      } catch (e) {
        console.error(e);
        return [];
      } finally {
        inFlightClientRequests.delete(key);
      }
    })();

    inFlightClientRequests.set(key, promise);
    return promise;
  },

  // 4. Buscar recursos con caché ultra-rápida, paginación y deduplicación
  async searchResources(params: {
    search?: string;
    q?: string;
    codigo?: number | string;
    department?: string;
    iddpto?: string;
    activity?: string;
    actividad?: string;
    subactivity?: string;
    category?: string;
    categoria?: string;
    type?: string;
    subtype?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ResourceItem>> {
    const query = new URLSearchParams();
    const searchVal = params.search || params.q;
    const deptVal = params.department || params.iddpto;
    const actVal = params.activity || params.actividad;
    const catVal = params.category || params.categoria;

    if (searchVal) query.set('search', searchVal);
    if (params.codigo) query.set('codigo', String(params.codigo));
    if (deptVal) query.set('department', deptVal);
    if (actVal) query.set('activity', actVal);
    if (params.subactivity) query.set('subactivity', params.subactivity);
    if (catVal) query.set('category', catVal);
    if (params.type) query.set('type', params.type);
    if (params.subtype) query.set('subtype', params.subtype);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const cacheKey = `search_${query.toString()}`;
    const cached = getCached<PaginatedResponse<ResourceItem>>(cacheKey);
    if (cached) return cached;

    if (inFlightClientRequests.has(cacheKey)) {
      return inFlightClientRequests.get(cacheKey);
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/resources?${query.toString()}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          return { data: [], total: 0, page: 1, limit: params.limit || 12, totalPages: 1 };
        }
        const data = await res.json();
        // Compatibilidad si el backend devuelve un array directamente
        const paginated: PaginatedResponse<ResourceItem> = Array.isArray(data)
          ? {
              data,
              total: data.length,
              page: params.page || 1,
              limit: params.limit || 12,
              totalPages: Math.ceil(data.length / (params.limit || 12)) || 1,
            }
          : data;

        return paginated;
      } catch (e) {
        console.error(e);
        return { data: [], total: 0, page: 1, limit: params.limit || 12, totalPages: 1 };
      } finally {
        inFlightClientRequests.delete(cacheKey);
      }
    })();

    inFlightClientRequests.set(cacheKey, promise);
    return promise;
  },

  // Alias para compatibilidad
  async getResources(params: any): Promise<PaginatedResponse<ResourceItem>> {
    return this.searchResources(params);
  },

  // 5. Obtener Recursos Destacados Aleatorios (Random 6)
  async getFeaturedResources(params?: {
    category?: string;
    limit?: number;
  }): Promise<ResourceItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.category) query.set('category', params.category);

      const res = await fetch(`${API_BASE_URL}/featured?${query.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // 6. Obtener Recursos Georreferenciados para OpenStreetMap
  async getMapResources(params?: {
    department?: string;
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<ResourceItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.department) query.set('department', params.department);
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.limit) query.set('limit', String(params.limit));

      const res = await fetch(`${API_BASE_URL}/map/resources?${query.toString()}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('Error al cargar recursos para el mapa:', e);
      return [];
    }
  },

  // 6. Obtener detalle de ficha oficial
  async getFichaDetail(codFicha: number): Promise<FichaDetail | null> {
    const cacheKey = `ficha_${codFicha}`;
    const cached = getCached<FichaDetail>(cacheKey);
    if (cached) return cached;

    if (inFlightClientRequests.has(cacheKey)) {
      return inFlightClientRequests.get(cacheKey);
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/resources/${codFicha}`);
        if (!res.ok) return null;
        const data = await res.json();
        setCached(cacheKey, data, 86400000);
        return data;
      } catch (e) {
        console.error(e);
        return null;
      } finally {
        inFlightClientRequests.delete(cacheKey);
      }
    })();

    inFlightClientRequests.set(cacheKey, promise);
    return promise;
  },

  // 7. Obtener cronograma oficial de la visita del Papa León XIV
  async getPapaCronograma(department?: string): Promise<PapaCronogramaResponse> {
    const query = department ? `?department=${encodeURIComponent(department)}` : '';
    const cacheKey = `papa_cronograma_${department || 'all'}`;
    const cached = getCached<PapaCronogramaResponse>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${API_BASE_URL}/papa-leon-xiv${query}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setCached(cacheKey, data, 3600000);
        return data;
      }
    } catch (e) {
      console.warn('API backend no disponible para cronograma papal, usando fallback local.', e);
    }

    // Fallback a datos locales estructurados
    const data = localPapaData as unknown as PapaCronogramaResponse;
    if (department && department.trim()) {
      const deptNormalized = department.trim().toLowerCase();
      const filtered = data.por_departamento.filter(
        (d) =>
          d.departamento.toLowerCase() === deptNormalized ||
          d.slug.toLowerCase() === deptNormalized,
      );
      const filteredData: PapaCronogramaResponse = {
        ...data,
        por_departamento: filtered,
      };
      setCached(cacheKey, filteredData, 3600000);
      return filteredData;
    }

    setCached(cacheKey, data, 3600000);
    return data;
  },
};
