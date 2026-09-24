import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';

export const metadata: Metadata = {
  title: 'Directorio de Atractivos y Recursos Turísticos del Perú',
  description:
    'Explora y filtra más de 4,800 atractivos, sitios arqueológicos, maravillas naturales y destinos turísticos oficiales del Perú en los 25 departamentos con datos abiertos de MINCETUR.',
  alternates: {
    canonical: '/turismo',
  },
  openGraph: {
    title: 'Directorio de Atractivos y Recursos Turísticos del Perú | OpenData Perú',
    description:
      'Explora y filtra más de 4,800 atractivos, sitios arqueológicos, maravillas naturales y destinos turísticos oficiales del Perú en los 25 departamentos con datos abiertos de MINCETUR.',
    url: `${SITE_URL}/turismo`,
    type: 'website',
  },
};

export default function TurismoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
