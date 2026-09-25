import {
  MuseoCategory,
  MuseoDepartment,
  MuseoItem,
  MuseoPaginatedResponse,
  MuseoServiceItem,
  MuseoStats,
} from '../types/museo';
import { API_BASE_URL } from './api';

const clientCache = new Map<string, { data: any; expiry: number }>();
const inFlightRequests = new Map<string, Promise<any>>();

const getCached = <T>(key: string): T | null => {
  const item = clientCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  return null;
};

const setCached = (key: string, data: any, ttlMs: number = 300000) => {
  clientCache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
};

export const museosApi = {
  // 1. Departamentos
  async getDepartments(): Promise<MuseoDepartment[]> {
    const key = 'museos:departments';
    const cached = getCached<MuseoDepartment[]>(key);
    if (cached) return cached;

    if (inFlightRequests.has(key)) return inFlightRequests.get(key);

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/museos/departments`);
        if (!res.ok) throw new Error('Error al cargar departamentos');
        const data = await res.json();
        setCached(key, data, 3600000);
        return data;
      } catch (err) {
        console.error('Error getDepartments:', err);
        return [];
      } finally {
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, promise);
    return promise;
  },

  // 2. Categorías
  async getCategories(): Promise<MuseoCategory[]> {
    const key = 'museos:categories';
    const cached = getCached<MuseoCategory[]>(key);
    if (cached) return cached;

    if (inFlightRequests.has(key)) return inFlightRequests.get(key);

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/museos/categories`);
        if (!res.ok) throw new Error('Error al cargar categorías');
        const data = await res.json();
        setCached(key, data, 3600000);
        return data;
      } catch (err) {
        console.error('Error getCategories:', err);
        return [];
      } finally {
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, promise);
    return promise;
  },

  // 3. Catálogo de Servicios
  async getServices(): Promise<MuseoServiceItem[]> {
    const key = 'museos:services';
    const cached = getCached<MuseoServiceItem[]>(key);
    if (cached) return cached;

    if (inFlightRequests.has(key)) return inFlightRequests.get(key);

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/museos/services`);
        if (!res.ok) throw new Error('Error al cargar servicios');
        const data = await res.json();
        setCached(key, data, 3600000);
        return data;
      } catch (err) {
        console.error('Error getServices:', err);
        return [];
      } finally {
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, promise);
    return promise;
  },

  // 4. Estadísticas
  async getStats(): Promise<MuseoStats | null> {
    const key = 'museos:stats';
    const cached = getCached<MuseoStats>(key);
    if (cached) return cached;

    try {
      const res = await fetch(`${API_BASE_URL}/museos/stats`);
      if (!res.ok) return null;
      const data = await res.json();
      setCached(key, data, 1800000);
      return data;
    } catch {
      return null;
    }
  },

  // 5. Destacados
  async getFeatured(limit: number = 6): Promise<MuseoItem[]> {
    const key = `museos:featured:${limit}`;
    const cached = getCached<MuseoItem[]>(key);
    if (cached) return cached;

    try {
      const res = await fetch(`${API_BASE_URL}/museos/featured?limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      setCached(key, data, 1800000);
      return data;
    } catch (err) {
      console.error('Error getFeatured:', err);
      return [];
    }
  },

  // 6. Búsqueda y Listado con Filtros
  async searchMuseos(params: {
    search?: string;
    department?: string;
    category?: string;
    status?: string;
    hasVirtualTour?: boolean;
    page?: number;
    limit?: number;
  }): Promise<MuseoPaginatedResponse> {
    const urlParams = new URLSearchParams();
    if (params.search) urlParams.set('search', params.search);
    if (params.department) urlParams.set('department', params.department);
    if (params.category) urlParams.set('category', params.category);
    if (params.status) urlParams.set('status', params.status);
    if (params.hasVirtualTour) urlParams.set('hasVirtualTour', 'true');
    if (params.page) urlParams.set('page', String(params.page));
    if (params.limit) urlParams.set('limit', String(params.limit));

    const key = `museos:search:${urlParams.toString()}`;
    const cached = getCached<MuseoPaginatedResponse>(key);
    if (cached) return cached;

    try {
      const res = await fetch(`${API_BASE_URL}/museos?${urlParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Error al consultar museos`);
      }
      const data: MuseoPaginatedResponse = await res.json();
      setCached(key, data, 120000);
      return data;
    } catch (err) {
      console.error('Error searchMuseos:', err);
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 12,
        totalPages: 1,
      };
    }
  },

  // 7. GeoJSON
  async getGeoJson(options?: { department?: string; category?: string }) {
    const urlParams = new URLSearchParams();
    if (options?.department) urlParams.set('department', options.department);
    if (options?.category) urlParams.set('category', options.category);

    const key = `museos:geojson:${urlParams.toString()}`;
    const cached = getCached<any>(key);
    if (cached) return cached;

    try {
      const res = await fetch(`${API_BASE_URL}/museos/map/geojson?${urlParams.toString()}`);
      if (!res.ok) return { type: 'FeatureCollection', features: [] };
      const data = await res.json();
      setCached(key, data, 1800000);
      return data;
    } catch {
      return { type: 'FeatureCollection', features: [] };
    }
  },

  // 8. Detalle
  async getDetail(slug: string): Promise<MuseoItem | null> {
    let cleanSlug = slug;
    try {
      cleanSlug = decodeURIComponent(decodeURIComponent(slug));
    } catch {
      try {
        cleanSlug = decodeURIComponent(slug);
      } catch {
        cleanSlug = slug;
      }
    }

    const key = `museos:detail:${cleanSlug}`;
    const cached = getCached<MuseoItem>(key);
    if (cached) return cached;

    try {
      const res = await fetch(`${API_BASE_URL}/museos/${encodeURIComponent(cleanSlug)}`);
      if (!res.ok) return null;
      const data: MuseoItem = await res.json();
      setCached(key, data, 60000);
      return data;
    } catch (err) {
      console.error('Error getDetail:', err);
      return null;
    }
  },
};
