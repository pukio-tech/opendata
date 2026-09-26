'use client';

import React from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-16 pb-12 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800/80">
          {/* Column 1 & 2: Brand Info & Socials */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-md bg-[#0B3B60] text-white flex items-center justify-center shadow-xs">
                <Icons.Database className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  OPEN<span className="text-[#0B3B60] dark:text-sky-400">DATA</span>
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              {t('footer.desc')}
            </p>

            {/* Sello de Verificación y Fuentes Oficiales Públicas */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2 max-w-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Icons.ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Datos Públicos Oficiales Verificados</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Inventario Turístico:</span>
                  <strong className="text-slate-800 dark:text-slate-200">MINCETUR</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Directorio Empresarial:</span>
                  <strong className="text-slate-800 dark:text-slate-200">SUNAT</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Guía de Museos:</span>
                  <strong className="text-slate-800 dark:text-slate-200">MINCUL</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cronograma Estado:</span>
                  <strong className="text-slate-800 dark:text-slate-200">IRTP / Presidencia</strong>
                </div>
              </div>
            </div>

            {/* Contacto & Redes Oficiales */}
            <div className="pt-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <a
                  href="https://www.linkedin.com/company/pukio-tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn de PUKIO Tech"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0B3B60] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium"
                >
                  <Icons.LinkedIn className="w-3.5 h-3.5 text-[#0A66C2]" />
                  <span>PUKIO en LinkedIn</span>
                </a>

                <a
                  href="mailto:contacto.pukio@gmail.com"
                  aria-label="Correo de contacto de PUKIO"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0B3B60] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium"
                >
                  <Icons.Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>contacto.pukio@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Navegación */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('footer.nav')}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  {t('footer.navHome')}
                </Link>
              </li>
              <li>
                <Link href="/turismo" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  {t('footer.navTurismo')}
                </Link>
              </li>
              <li>
                <Link href="/empresas" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  Directorio de Empresas
                </Link>
              </li>
              <li>
                <Link href="/museos" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  Museos del Perú
                </Link>
              </li>
              <li>
                <Link href="/ruta-del-papa" className="hover:text-amber-800 dark:hover:text-amber-400 text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors">
                  <span>Ruta del Papa León XIV</span>
                </Link>
              </li>
              <li>
                <Link href="/turismo#mapa" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  {t('footer.navMap')}
                </Link>
              </li>
              <li>
                <Link href="/turismo#listado-atractivos" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  {t('footer.navCatalog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Datos y API */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('footer.dataApi')}</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Icons.Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>API REST Pública</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Icons.Code className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Formato JSON / GeoJSON</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Icons.Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Estándar OGC & EPSG:4326</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Icons.Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Licencia Abierta CC-BY 4.0</span>
              </li>
              <li className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <a
                  href="https://www.datosabiertos.gob.pe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0B3B60] dark:hover:text-white transition-colors inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
                >
                  <span>🇵🇪 DatosAbiertos.gob.pe</span>
                  <Icons.ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Marco Legal & Políticas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('footer.transparency')}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/politicas-de-privacidad" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terminos-y-condiciones#licencia" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
                  {t('footer.license')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Indicators */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400">
              OpenData © {new Date().getFullYear()} • Desarrollado por{' '}
              <a
                href="https://www.linkedin.com/company/pukio-tech"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                PUKIO
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <span>{t('footer.departments')}</span>
            <span>•</span>
            <span>{t('footer.resources')}</span>
            <span>•</span>
            <span>{t('footer.open')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
