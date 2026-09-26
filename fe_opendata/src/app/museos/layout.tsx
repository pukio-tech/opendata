import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';

export const metadata: Metadata = {
  title: 'Directorio Oficial de Museos del Perú | OpenData',
  description:
    'Inventario y catálogo oficial de la Red Nacional de Museos del Ministerio de Cultura del Perú (MINCUL). Consulta colecciones, horarios oficiales, tarifas y recorridos virtuales 360° interactivos.',
  alternates: {
    canonical: '/museos',
  },
  openGraph: {
    title: 'Directorio Oficial de Museos del Perú | OpenData',
    description:
      'Inventario y catálogo oficial de la Red Nacional de Museos del Ministerio de Cultura del Perú (MINCUL) con datos abiertos oficiales verificados.',
    url: `${SITE_URL}/museos`,
    siteName: 'OpenData Perú',
    type: 'website',
  },
};

export default function MuseosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: 'Directorio Oficial de Museos del Perú',
    description:
      'Catálogo e inventario nacional de museos públicos y privados del Perú con datos abiertos del Ministerio de Cultura.',
    url: `${SITE_URL}/museos`,
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'MINCUL - Ministerio de Cultura del Perú',
      url: 'https://www.gob.pe/cultura',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
