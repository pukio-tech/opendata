import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';

export const metadata: Metadata = {
  title: 'Ruta del Papa León XIV en el Perú | Cronograma Oficial y Geoportal',
  description:
    'Programa oficial de actividades, fechas, horarios y mapa interactivo de la Visita Apostólica del Papa León XIV al Perú (Lima, Callao, Lambayeque, Cajamarca, Cusco y Ucayali).',
  alternates: {
    canonical: '/ruta-del-papa',
  },
  openGraph: {
    title: 'Ruta del Papa León XIV en el Perú | Cronograma Oficial y Geoportal',
    description:
      'Programa oficial de actividades, fechas, horarios y mapa interactivo de la Visita Apostólica del Papa León XIV al Perú.',
    url: `${SITE_URL}/ruta-del-papa`,
    type: 'website',
  },
};

export default function RutaPapaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
