import { MetadataRoute } from 'next';
import { createResourceSlug } from '../utils/slug';

export const revalidate = 86400; // Revalidar diariamente

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata-pe.vercel.app';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Rutas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/turismo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/politicas-de-privacidad`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terminos-y-condiciones`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Rutas dinámicas de recursos turísticos
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiUrl}/resources?limit=2000`, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data || [];

      for (const item of items) {
        const codigo = item.codigo || item.cod_recurso || item.id;
        const nombre = item.nombre;
        if (codigo && nombre) {
          const slug = createResourceSlug(nombre, codigo);
          dynamicRoutes.push({
            url: `${baseUrl}/turismo/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // Si la API no está activa durante el build estático, se conservan las rutas base
  }

  return [...staticRoutes, ...dynamicRoutes];
}
