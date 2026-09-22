import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'OpenData Perú | Plataforma Nacional de Datos Abiertos de Turismo',
  description: 'Explora y consulta de manera dinámica los recursos, atractivos y actividades turísticas de los 25 departamentos del Perú mediante la plataforma de datos abiertos OpenData.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`dark ${montserrat.variable}`}>
      <body className={`${montserrat.className} font-sans min-h-screen flex flex-col antialiased`} suppressHydrationWarning>
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

