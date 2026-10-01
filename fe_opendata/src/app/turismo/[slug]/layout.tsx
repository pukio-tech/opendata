import type { Metadata } from 'next';
import { extractCodeFromSlug } from '../../../utils/slug';
import { cleanLabel } from '../../../utils/minceturTranslate';
import { FichaDetail } from '../../../types/mincetur';
import fallbackResources from '../../../data/resources-sitemap.json';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Mapeo en memoria para búsquedas O(1) instantáneas
const fallbackMap = new Map<number, (typeof fallbackResources)[0]>();
if (Array.isArray(fallbackResources)) {
  for (const item of fallbackResources) {
    if (item.c) {
      fallbackMap.set(item.c, item);
    }
  }
}

interface PageProps {
  params: { slug: string };
  children: React.ReactNode;
}

async function fetchFicha(codigo: number): Promise<FichaDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/resources/${codigo}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const codigo = extractCodeFromSlug(params.slug);
  const fallbackItem = codigo ? fallbackMap.get(codigo) : null;
  const fichaDetail = codigo ? await fetchFicha(codigo) : null;

  const rawName =
    fichaDetail?.nombre ||
    fallbackItem?.n ||
    (codigo
      ? params.slug.replace(new RegExp(`-${codigo}$`), '').replace(/-/g, ' ')
      : params.slug.replace(/-/g, ' '));

  const nombreClean = cleanLabel(rawName);
  const deptClean = cleanLabel(fichaDetail?.departamento || fallbackItem?.d || 'Perú');
  const provClean = cleanLabel(fichaDetail?.provincia || fallbackItem?.p || '');
  const distClean = cleanLabel(fichaDetail?.distrito || fallbackItem?.dis || '');
  const catClean = cleanLabel(fichaDetail?.categoria || fallbackItem?.cat || 'Recurso Turístico');

  const title = `${nombreClean}, ${deptClean} | Ficha Turística Oficial | OpenData Perú`;
  const locationText = [distClean, provClean, deptClean].filter(Boolean).join(', ');
  const description =
    fichaDetail?.descripcion
      ? `${fichaDetail.descripcion.slice(0, 160).trim()}...`
      : `Consulta la ficha técnica oficial de ${nombreClean} (${catClean}) en ${locationText}. Datos abiertos de MINCETUR con coordenadas, accesos y actividades.`;

  const photoUrl =
    fichaDetail?.foto_principal ||
    fallbackItem?.f ||
    (codigo
      ? `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${codigo}`
      : `${SITE_URL}/og-default.jpg`);

  return {
    title,
    description,
    alternates: {
      canonical: `/turismo/${params.slug}`,
    },
    openGraph: {
      title: `${nombreClean} - Atractivo Turístico en ${deptClean}, Perú`,
      description,
      url: `${SITE_URL}/turismo/${params.slug}`,
      siteName: 'OpenData Perú',
      type: 'article',
      images: [
        {
          url: photoUrl,
          width: 1200,
          height: 630,
          alt: nombreClean,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nombreClean}, ${deptClean} | OpenData Perú`,
      description,
      images: [photoUrl],
    },
  };
}

export default async function TurismoDetailLayout({
  children,
  params,
}: PageProps) {
  const codigo = extractCodeFromSlug(params.slug);
  const fallbackItem = codigo ? fallbackMap.get(codigo) : null;
  const fichaDetail = codigo ? await fetchFicha(codigo) : null;

  let jsonLd = null;
  if (fichaDetail || fallbackItem) {
    const rawName = fichaDetail?.nombre || fallbackItem?.n || '';
    const nombreClean = cleanLabel(rawName);
    const photoUrl =
      fichaDetail?.foto_principal ||
      fallbackItem?.f ||
      (codigo
        ? `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${codigo}`
        : '');

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: nombreClean,
      description:
        fichaDetail?.descripcion ||
        `Ficha técnica oficial de ${nombreClean} en el inventario nacional de recursos turísticos del Perú.`,
      image: photoUrl,
      url: `${SITE_URL}/turismo/${params.slug}`,
      provider: {
        '@type': 'GovernmentOrganization',
        name: 'MINCETUR - Ministerio de Comercio Exterior y Turismo del Perú',
        url: 'https://www.gob.pe/mincetur',
      },
      address: {
        '@type': 'PostalAddress',
        addressRegion: fichaDetail?.departamento || fallbackItem?.d,
        addressLocality: fichaDetail?.distrito || fallbackItem?.dis,
        addressCountry: 'PE',
      },
      ...(fichaDetail?.x && fichaDetail?.y
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: fichaDetail.y,
              longitude: fichaDetail.x,
            },
          }
        : {}),
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
