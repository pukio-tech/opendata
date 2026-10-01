import type { Metadata } from 'next';
import { museosApi } from '../../../services/museosApi';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';

interface PageProps {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const museo = await museosApi.getDetail(params.slug);

  if (!museo) {
    return {
      title: 'Museo | Inventario Nacional de Museos | OpenData Perú',
      description:
        'Directorio y ficha oficial del Sistema Nacional de Museos del Estado del Ministerio de Cultura del Perú.',
      alternates: {
        canonical: `/museos/${params.slug}`,
      },
    };
  }

  const title = `${museo.nombre} - ${museo.departamento || 'Perú'} | Inventario Oficial de Museos | OpenData Perú`;
  const locationText = [museo.distrito, museo.provincia, museo.departamento].filter(Boolean).join(', ');
  const description =
    museo.descripcion
      ? `${museo.descripcion.slice(0, 160)}...`
      : `Consulta la ficha oficial de ${museo.nombre} en ${locationText}. Horarios, tarifas, recorrido virtual e información del Ministerio de Cultura.`;

  const photoUrl =
    museo.imagen_portada ||
    museo.imagen_tarjeta ||
    (museo.galeria && museo.galeria[0]?.url) ||
    `${SITE_URL}/og-default.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: `/museos/${params.slug}`,
    },
    openGraph: {
      title: `${museo.nombre} - ${museo.departamento || 'Perú'}`,
      description,
      url: `${SITE_URL}/museos/${params.slug}`,
      siteName: 'OpenData Perú',
      type: 'article',
      images: [
        {
          url: photoUrl,
          width: 1200,
          height: 630,
          alt: museo.nombre,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${museo.nombre} | OpenData Perú`,
      description,
      images: [photoUrl],
    },
  };
}

export default async function MuseoDetailLayout({
  children,
  params,
}: PageProps) {
  const museo = await museosApi.getDetail(params.slug);

  let jsonLd = null;
  if (museo) {
    const photoUrl =
      museo.imagen_portada ||
      museo.imagen_tarjeta ||
      (museo.galeria && museo.galeria[0]?.url) ||
      '';

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Museum',
      name: museo.nombre,
      description: museo.descripcion || `Ficha oficial del museo ${museo.nombre}`,
      image: photoUrl,
      url: `${SITE_URL}/museos/${params.slug}`,
      telephone: museo.telefono,
      email: museo.email,
      provider: {
        '@type': 'GovernmentOrganization',
        name: 'Ministerio de Cultura del Perú',
        url: 'https://www.gob.pe/cultura',
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: museo.direccion,
        addressLocality: museo.distrito,
        addressRegion: museo.departamento,
        addressCountry: 'PE',
      },
      ...(museo.latitud && museo.longitud
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: museo.latitud,
              longitude: museo.longitud,
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
