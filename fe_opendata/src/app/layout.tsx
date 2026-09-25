import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { ViewTransitions } from 'next-view-transitions';
import Script from 'next/script';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { GoogleAnalytics } from '../components/GoogleAnalytics';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-PMQVEQGWG5';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OpenData Perú | Datos Abiertos de Turismo y Empresas',
    template: '%s | OpenData Perú',
  },
  description:
    'Consulta datos abiertos de recursos turísticos y empresas del Perú. Información oficial, mapas y fichas técnicas de los 25 departamentos.',
  applicationName: 'OpenData Perú',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/logo.png'],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  keywords: [
    'OpenData Perú',
    'datos abiertos turismo',
    'turismo Perú',
    'recursos turísticos del Perú',
    'empresas peruanas',
    'consulta RUC SUNAT',
    'directorio empresarial Perú',
    'inventario nacional de recursos turísticos',
    'atractivos turísticos',
    'mapa turístico Perú',
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
    title: 'OpenData Perú | Datos Abiertos de Turismo y Empresas',
    description:
      'Consulta datos abiertos de recursos turísticos y empresas del Perú con georreferenciación, mapas y fichas técnicas oficiales.',
    images: [
      {
        url: `${SITE_URL}/logo.png`,
        width: 800,
        height: 600,
        alt: 'OpenData Perú Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenData Perú | Datos Abiertos de Turismo y Empresas',
    description:
      'Consulta datos abiertos de recursos turísticos y empresas del Perú con georreferenciación, mapas y fichas técnicas oficiales.',
    images: [`${SITE_URL}/logo.png`],
  },
  alternates: {
    canonical: './',
  },
  verification: {
    google: 'p6mJLAtgJyRplQaeGVNm8Kc0TPdawAI3oP3KbWFgfss',
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
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/logo.png`,
    description:
      'Plataforma Nacional de Datos Abiertos de Turismo del Perú con información del inventario turístico oficial.',
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
    <ViewTransitions>
      <html lang="es" suppressHydrationWarning className={`dark ${montserrat.variable}`}>
        <head>
          <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
          <link rel="apple-touch-icon" href="/logo.png" />
          <link rel="shortcut icon" href="/logo.png" />
          <link rel="preconnect" href="https://images.unsplash.com" />
          <link rel="preconnect" href="https://consultasenlinea.mincetur.gob.pe" crossOrigin="" />
          <link rel="dns-prefetch" href="https://images.unsplash.com" />
          <link rel="dns-prefetch" href="https://consultasenlinea.mincetur.gob.pe" />
        </head>
        <body className={`${montserrat.className} font-sans min-h-screen flex flex-col antialiased overflow-x-hidden w-full max-w-full`} suppressHydrationWarning>
          <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5824072777833469"
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <ThemeProvider>
            <LanguageProvider>
              <Navbar />
              <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
                {children}
              </div>
              <Footer />
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}

