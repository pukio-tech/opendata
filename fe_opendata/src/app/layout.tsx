import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata-pe.vercel.app';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-PMQVEQGWG5';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OpenData Perú | Plataforma Nacional de Datos Abiertos de Turismo',
    template: '%s | OpenData Perú',
  },
  description:
    'Explora y consulta de manera dinámica los recursos, atractivos y actividades turísticas de los 25 departamentos del Perú mediante la plataforma de datos abiertos OpenData MINCETUR.',
  applicationName: 'OpenData Perú',
  keywords: [
    'OpenData Perú',
    'MINCETUR',
    'datos abiertos turismo',
    'turismo Perú',
    'inventario nacional de recursos turísticos',
    'atractivos turísticos',
    'destinos Perú',
    'mapa turístico Perú',
    'turismo vivencial',
    'patrimonio cultural',
  ],
  authors: [{ name: 'OpenData Perú' }],
  creator: 'OpenData Perú',
  publisher: 'OpenData Perú',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: SITE_URL,
    siteName: 'OpenData Perú',
    title: 'OpenData Perú | Plataforma Nacional de Datos Abiertos de Turismo',
    description:
      'Explora y consulta más de 5,000 recursos y atractivos turísticos oficiales del Perú con georreferenciación, fotos y fichas técnicas del MINCETUR.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenData Perú | Plataforma Nacional de Datos Abiertos de Turismo',
    description:
      'Explora y consulta más de 5,000 recursos y atractivos turísticos oficiales del Perú con georreferenciación, fotos y fichas técnicas del MINCETUR.',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OpenData Perú',
    url: SITE_URL,
    description:
      'Plataforma Nacional de Datos Abiertos de Turismo del Perú con información del inventario oficial de MINCETUR.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/turismo?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="es" suppressHydrationWarning className={`dark ${montserrat.variable}`}>
      <body className={`${montserrat.className} font-sans min-h-screen flex flex-col antialiased`} suppressHydrationWarning>
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <ThemeProvider>
          <LanguageProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

