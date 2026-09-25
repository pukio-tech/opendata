import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';

export const metadata: Metadata = {
  title: 'Directorio Oficial de Museos del Perú | OpenData',
  description:
    'Explora la red nacional de museos del Ministerio de Cultura y museos públicos y privados. Consulta colecciones, horarios oficiales, tarifas y recorridos virtuales 360° interactivos.',
  alternates: {
    canonical: '/museos',
  },
  openGraph: {
    title: 'Directorio Oficial de Museos del Perú | OpenData',
    description:
      'Explora la red nacional de museos del Ministerio de Cultura y museos públicos y privados con datos abiertos oficiales.',
    url: `${SITE_URL}/museos`,
    type: 'website',
  },
};

export default function MuseosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
