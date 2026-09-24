import type { Metadata } from 'next';
import { extractCodeFromSlug } from '../../../utils/slug';
import { cleanLabel } from '../../../utils/minceturTranslate';
import fallbackResources from '../../../data/resources-sitemap.json';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';

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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const codigo = extractCodeFromSlug(params.slug);
  const resource = codigo ? fallbackMap.get(codigo) : null;

  if (!resource) {
    return {
      title: 'Recurso Turístico | OpenData Perú',
      description:
        'Ficha técnica e información oficial del inventario nacional de recursos turísticos de MINCETUR.',
      alternates: {
        canonical: `/turismo/${params.slug}`,
      },
    };
  }

  const nombreClean = cleanLabel(resource.n);
  const deptClean = cleanLabel(resource.d);
  const provClean = cleanLabel(resource.p);
  const distClean = cleanLabel(resource.dis);
  const catClean = cleanLabel(resource.cat);

  const title = `${nombreClean}, ${deptClean} | Ficha Turística Oficial | OpenData Perú`;
  const locationText = [distClean, provClean, deptClean].filter(Boolean).join(', ');
  const description = `Consulta la ficha técnica oficial de ${nombreClean} (${catClean}) en ${locationText}. Datos abiertos de MINCETUR con coordenadas, accesos y actividades.`;
  const photoUrl =
    resource.f ||
    `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${codigo}`;

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

export default function TurismoDetailLayout({
  children,
  params,
}: PageProps) {
  const codigo = extractCodeFromSlug(params.slug);
  const resource = codigo ? fallbackMap.get(codigo) : null;

  let jsonLd = null;
  if (resource) {
    const nombreClean = cleanLabel(resource.n);
    const photoUrl =
      resource.f ||
      `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${codigo}`;

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: nombreClean,
      description: `Ficha técnica oficial de ${nombreClean} en el inventario nacional de recursos turísticos del Perú.`,
      image: photoUrl,
      url: `${SITE_URL}/turismo/${params.slug}`,
      address: {
        '@type': 'PostalAddress',
        addressRegion: resource.d,
        addressLocality: resource.dis,
        addressCountry: 'PE',
      },
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
