import { ActivityItem, CategoryItem, DepartmentItem, FichaDetail, PaginatedResponse, ResourceItem } from '../types/mincetur';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getPhotoUrl = (codigo: number | string) => `${API_BASE_URL}/photos/${codigo}`;

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

  // 5. Obtener detalle de ficha oficial
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
};
