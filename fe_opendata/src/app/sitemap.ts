import { MetadataRoute } from 'next';
import { createResourceSlug } from '../utils/slug';
import fallbackResources from '../data/resources-sitemap.json';

export const revalidate = 86400; // Revalidar diariamente

// Los 25 departamentos del Perú para posicionamiento regional
const DEPARTMENTS = [
  'AMAZONAS',
  'ANCASH',
  'APURIMAC',
  'AREQUIPA',
  'AYACUCHO',
  'CAJAMARCA',
  'CALLAO',
  'CUSCO',
  'HUANCAVELICA',
  'HUANUCO',
  'ICA',
  'JUNIN',
  'LA LIBERTAD',
  'LAMBAYEQUE',
  'LIMA',
  'LORETO',
  'MADRE DE DIOS',
  'MOQUEGUA',
  'PASCO',
  'PIURA',
  'PUNO',
  'SAN MARTIN',
  'TACNA',
  'TUMBES',
  'UCAYALI',
];

// Las 5 categorías oficiales de MINCETUR
const CATEGORIES = [
  'SITIOS NATURALES',
  'MANIFESTACIONES CULTURALES',
  'FOLCLORE',
  'REALIZACIONES TECNICAS, CIENTIFICAS U ARTISTICAS CONTEMPORANEAS',
  'ACONTECIMIENTOS PROGRAMADOS',
];

interface ResourceEntry {
  codigo: number | string;
  nombre: string;
  departamento?: string;
  jerarquia?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const now = new Date();

  // 1. Rutas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/turismo`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/ruta-del-papa`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/politicas-de-privacidad`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terminos-y-condiciones`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 2. Hubs departamentales para potenciar búsquedas ("turismo cusco", "atractivos arequipa", etc.)
  const departmentRoutes: MetadataRoute.Sitemap = DEPARTMENTS.map((dept) => ({
    url: `${baseUrl}/turismo?department=${encodeURIComponent(dept)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 3. Hubs por categorías oficiales para SEO temático
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/turismo?category=${encodeURIComponent(cat)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Hubs departamentales de la Visita Papal
  const PAPA_DEPARTMENTS = ['lima', 'callao', 'lambayeque', 'cajamarca', 'cusco', 'ucayali'];
  const papaDepartmentRoutes: MetadataRoute.Sitemap = PAPA_DEPARTMENTS.map((dept) => ({
    url: `${baseUrl}/ruta-del-papa?department=${encodeURIComponent(dept)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 4. Catálogo completo de recursos turísticos dinámicos
  const resourcesMap = new Map<number | string, ResourceEntry>();

  // Cargar catálogo de respaldo primero (garantiza >4,800 páginas indexadas siempre)
  if (Array.isArray(fallbackResources)) {
    for (const item of fallbackResources) {
      if (item.c && item.n) {
        resourcesMap.set(item.c, {
          codigo: item.c,
          nombre: item.n,
          departamento: item.d,
          jerarquia: item.j,
        });
      }
    }
  }

  // Intentar actualizar con datos vivos de la API si está disponible
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Intentar endpoint de catálogo completo o búsqueda amplia
    const res = await fetch(`${apiUrl}/resources/all`, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    }).catch(async () => {
      return await fetch(`${apiUrl}/resources?limit=10000`, {
        signal: controller.signal,
        next: { revalidate: 86400 },
      });
    });

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data || [];

      for (const item of items) {
        const codigo = item.codigo || item.cod_recurso || item.id;
        const nombre = item.nombre;
        if (codigo && nombre) {
          resourcesMap.set(codigo, {
            codigo,
            nombre,
            departamento: item.departamento || item.desdpto,
            jerarquia: item.jerarquia || item.desjerarquia,
          });
        }
      }
    }
  } catch {
    // Si la API tarda o está inactiva durante el build, se utiliza íntegramente el catálogo de respaldo
  }

  // Generar rutas dinámicas optimizadas con prioridad según jerarquía turística
  const seenUrls = new Set<string>();
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  for (const item of resourcesMap.values()) {
    const slug = createResourceSlug(item.nombre, item.codigo);
    const url = `${baseUrl}/turismo/${slug}`;

    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Prioridad y frecuencia según jerarquía oficial MINCETUR
    // Jerarquía 4: Atractivos mundiales y maravillas (Machu Picchu, Líneas de Nasca, etc.)
    // Jerarquía 3: Atractivos de relevancia nacional
    // Jerarquía 2 y 1: Atractivos locales y de paso
    let priority = 0.7;
    let changeFrequency: 'daily' | 'weekly' | 'monthly' = 'monthly';

    const j = String(item.jerarquia || '').trim();
    if (j === '4') {
      priority = 0.9;
      changeFrequency = 'weekly';
    } else if (j === '3') {
      priority = 0.85;
      changeFrequency = 'weekly';
    } else if (j === '2') {
      priority = 0.75;
      changeFrequency = 'weekly';
    }

    dynamicRoutes.push({
      url,
      lastModified: now,
      changeFrequency,
      priority,
    });
  }

  return [
    ...staticRoutes,
    ...departmentRoutes,
    ...categoryRoutes,
    ...papaDepartmentRoutes,
    ...dynamicRoutes,
  ];
}

