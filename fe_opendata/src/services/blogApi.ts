import { API_BASE_URL } from './api';
import type { BlogDetailResponse, BlogListResponse } from '../types/blog';

/**
 * Servicio del blog para Server Components: usa la caché de datos de Next
 * (ISR) en lugar de la caché en memoria de los servicios cliente.
 */
const REVALIDATE_SECONDS = 300; // 5 min: los artículos nuevos del panel aparecen rápido

export const blogApi = {
  async list(page = 1, limit = 12): Promise<BlogListResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/blog?page=${page}&limit=${limit}`, {
        next: { revalidate: REVALIDATE_SECONDS, tags: ['blog'] },
      });
      if (!res.ok) return null;
      return (await res.json()) as BlogListResponse;
    } catch (err) {
      console.error('Error blogApi.list:', err);
      return null;
    }
  },

  /** Devuelve null si el artículo no existe o no está publicado (→ 404). */
  async detail(slug: string): Promise<BlogDetailResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/blog/${encodeURIComponent(slug)}`, {
        next: { revalidate: REVALIDATE_SECONDS, tags: ['blog', `blog:${slug}`] },
      });
      if (!res.ok) return null;
      return (await res.json()) as BlogDetailResponse;
    } catch (err) {
      console.error('Error blogApi.detail:', err);
      return null;
    }
  },
};

export function formatBlogDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}
