import { MetadataRoute } from 'next';
import { createResourceSlug } from '../utils/slug';
import fallbackResources from '../data/resources-sitemap.json';
import fallbackEmpresas from '../data/empresas-sitemap.json';

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

// Principales tipos societarios para indexación temática
const EMPRESA_TIPOS = [
  'SOCIEDAD ANONIMA CERRADA',
  'EMPRESA INDIVIDUAL DE RESP. LTDA',
  'ASOCIACION',
  'SOC.COM.RESPONS. LTDA',
  'SOCIEDAD ANONIMA',
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

interface EmpresaSitemapEntry {
  slug: string;
  ruc: string;
  fecha_actualizacion?: string;
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
      url: `${baseUrl}/museos`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/empresas`,
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

  // 2. Hubs departamentales de Turismo ("turismo cusco", "atractivos arequipa", etc.)
  const turismoDepartmentRoutes: MetadataRoute.Sitemap = DEPARTMENTS.map((dept) => ({
    url: `${baseUrl}/turismo?department=${encodeURIComponent(dept)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 3. Hubs departamentales de Empresas ("empresas en lima", "empresas arequipa sunat", etc.)
  const empresasDepartmentRoutes: MetadataRoute.Sitemap = DEPARTMENTS.map((dept) => ({
    url: `${baseUrl}/empresas?department=${encodeURIComponent(dept)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 4. Hubs por tipo societario de Empresas ("sociedades anonimas cerradas peru", etc.)
  const empresasTipoRoutes: MetadataRoute.Sitemap = EMPRESA_TIPOS.map((tipo) => ({
    url: `${baseUrl}/empresas?tipo=${encodeURIComponent(tipo)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 5. Hubs por categorías oficiales de Turismo para SEO temático
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/turismo?category=${encodeURIComponent(cat)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 6. Hubs departamentales de la Visita Papal
  const PAPA_DEPARTMENTS = ['lima', 'callao', 'lambayeque', 'cajamarca', 'cusco', 'ucayali'];
  const papaDepartmentRoutes: MetadataRoute.Sitemap = PAPA_DEPARTMENTS.map((dept) => ({
    url: `${baseUrl}/ruta-del-papa?department=${encodeURIComponent(dept)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 7. Catálogo completo de recursos turísticos dinámicos
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
    // Si la API tarda o está inactiva durante el build, se utiliza el catálogo de respaldo
  }

  // Generar rutas dinámicas optimizadas de Turismo
  const seenTurismoUrls = new Set<string>();
  const dynamicTurismoRoutes: MetadataRoute.Sitemap = [];

  for (const item of resourcesMap.values()) {
    const slug = createResourceSlug(item.nombre, item.codigo);
    const url = `${baseUrl}/turismo/${slug}`;

    if (seenTurismoUrls.has(url)) continue;
    seenTurismoUrls.add(url);

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

    dynamicTurismoRoutes.push({
      url,
      lastModified: now,
      changeFrequency,
      priority,
    });
  }

  // 8. Catálogo dinámico completo de empresas peruanas (SEO masivo para 32,100 empresas SUNAT)
  const empresasMap = new Map<string, { slug: string; ruc: string; fecha_actualizacion?: string }>();

  // Cargar catálogo de respaldo primero (garantiza las 32,100 empresas indexadas siempre)
  if (Array.isArray(fallbackEmpresas)) {
    for (const item of fallbackEmpresas as Array<{ s?: string; r?: string; d?: string }>) {
      const slug = item.s || item.r;
      if (slug) {
        empresasMap.set(slug, {
          slug,
          ruc: item.r || '',
          fecha_actualizacion: item.d,
        });
      }
    }
  }

  // Intentar actualizar con datos vivos de la API si está disponible
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${apiUrl}/empresas/sitemap`, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const empresasData: Array<{ slug?: string; ruc?: string; s?: string; r?: string; fecha_actualizacion?: string; d?: string }> = await res.json();

      for (const emp of empresasData) {
        const slug = emp.slug || emp.s || emp.ruc || emp.r;
        if (!slug) continue;
        empresasMap.set(slug, {
          slug,
          ruc: emp.ruc || emp.r || '',
          fecha_actualizacion: emp.fecha_actualizacion || emp.d,
        });
      }
    }
  } catch {
    // Si la API tarda, se utilizan las 32,100 empresas del catálogo de respaldo
  }

  const dynamicEmpresasRoutes: MetadataRoute.Sitemap = [];
  const seenEmpresasUrls = new Set<string>();

  for (const emp of empresasMap.values()) {
    const url = `${baseUrl}/empresas/${emp.slug}`;
    if (seenEmpresasUrls.has(url)) continue;
    seenEmpresasUrls.add(url);

    const lastMod = emp.fecha_actualizacion ? new Date(emp.fecha_actualizacion) : now;

    dynamicEmpresasRoutes.push({
      url,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  }

  return [
    ...staticRoutes,
    ...turismoDepartmentRoutes,
    ...empresasDepartmentRoutes,
    ...empresasTipoRoutes,
    ...categoryRoutes,
    ...papaDepartmentRoutes,
    ...dynamicTurismoRoutes,
    ...dynamicEmpresasRoutes,
  ];
}
