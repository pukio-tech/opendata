import {
  CatalogsResponse,
  EmpresaItem,
  EmpresasQueryParams,
  EmpresasStatsResponse,
  EmpresaSuggestion,
  PaginatedEmpresasResponse,
} from '../types/empresa';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Cache en memoria para navegación instantánea
const clientCache = new Map<string, { data: any; expiry: number }>();

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

export const empresasService = {
  /**
   * Búsqueda y listado paginado de empresas con filtros
   */
  async search(params: EmpresasQueryParams = {}): Promise<PaginatedEmpresasResponse> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.ruc) query.append('ruc', params.ruc);
    if (params.departamento) query.append('departamento', params.departamento);
    if (params.provincia) query.append('provincia', params.provincia);
    if (params.distrito) query.append('distrito', params.distrito);
    if (params.estado) query.append('estado', params.estado);
    if (params.condicion) query.append('condicion', params.condicion);
    if (params.ciiu) query.append('ciiu', params.ciiu);
    if (params.tipo) query.append('tipo', params.tipo);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const cacheKey = `empresas_list_${queryString}`;
    const cached = getCached<PaginatedEmpresasResponse>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/empresas?${queryString}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Error en búsqueda de empresas: ${res.statusText}`);
    }

    const data: PaginatedEmpresasResponse = await res.json();
    setCached(cacheKey, data, 60000); // 1 minuto
    return data;
  },

  /**
   * Obtener detalle completo de una empresa por RUC (11 dígitos)
   */
  async getByRuc(ruc: string): Promise<EmpresaItem> {
    const cacheKey = `empresa_ruc_${ruc}`;
    const cached = getCached<EmpresaItem>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/empresas/ruc/${encodeURIComponent(ruc)}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Empresa no encontrada: ${res.statusText}`);
    }

    const data: EmpresaItem = await res.json();
    setCached(cacheKey, data, 600000); // 10 minutos
    return data;
  },

  /**
   * Obtener detalle de una empresa por Slug / URL amigable
   */
  async getBySlug(slug: string): Promise<EmpresaItem> {
    const cacheKey = `empresa_slug_${slug}`;
    const cached = getCached<EmpresaItem>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/empresas/slug/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Empresa no encontrada: ${res.statusText}`);
    }

    const data: EmpresaItem = await res.json();
    setCached(cacheKey, data, 600000); // 10 minutos
    return data;
  },

  /**
   * Autocompletado rápido para barra de búsqueda
   */
  async suggest(query: string, limit = 8): Promise<EmpresaSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    const res = await fetch(
      `${API_BASE_URL}/empresas/suggest?q=${encodeURIComponent(query)}&limit=${limit}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Estadísticas y métricas generales del dataset
   */
  async getStats(): Promise<EmpresasStatsResponse> {
    const cacheKey = 'empresas_stats';
    const cached = getCached<EmpresasStatsResponse>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/empresas/stats`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Error al obtener estadísticas: ${res.statusText}`);
    }

    const data: EmpresasStatsResponse = await res.json();
    setCached(cacheKey, data, 300000); // 5 minutos
    return data;
  },

  /**
   * Catálogos para desplegables de filtrado
   */
  async getCatalogs(): Promise<CatalogsResponse> {
    const cacheKey = 'empresas_catalogs';
    const cached = getCached<CatalogsResponse>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/empresas/catalogs`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Error al obtener catálogos: ${res.statusText}`);
    }

    const data: CatalogsResponse = await res.json();
    setCached(cacheKey, data, 3600000); // 1 hora
    return data;
  },
};
