import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LanguageProvider } from '../context/LanguageContext';

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
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased" suppressHydrationWarning>
        <LanguageProvider>
          <Navbar />
          <div className="flex-1 flex flex-col bg-white text-slate-900">
            {children}
          </div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}

