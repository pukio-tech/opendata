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
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                <Icons.Database className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                OPEN<span className="text-sky-600 dark:text-sky-400">DATA</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              {t('footer.desc')}
            </p>

            {/* Redes Sociales */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider block mb-3">
                {t('footer.connect')}
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center justify-center transition-all"
                >
                  <Icons.Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 flex items-center justify-center transition-all"
                >
                  <Icons.Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-400/10 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center justify-center transition-all"
                >
                  <Icons.Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all"
                >
                  <Icons.GitHub className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Navegación */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('footer.nav')}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  {t('footer.navHome')}
                </Link>
              </li>
              <li>
                <Link href="/turismo" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  {t('footer.navTurismo')}
                </Link>
              </li>
              <li>
                <Link href="/ruta-del-papa" className="hover:text-amber-600 dark:hover:text-amber-400 font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 transition-colors">
                  <span>🇻🇦 Ruta del Papa León XIV</span>
                </Link>
              </li>
              <li>
                <Link href="/turismo#mapa" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  {t('footer.navMap')}
                </Link>
              </li>
              <li>
                <Link href="/turismo#listado-atractivos" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  {t('footer.navCatalog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Datos y API */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('footer.dataApi')}</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <Icons.Database className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>API REST Pública</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Icons.Code className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Formato JSON / GeoJSON</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Icons.Globe className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Estándar OGC & EPSG:4326</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Icons.Shield className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Licencia Abierta CC-BY</span>
              </li>
            </ul>
          </div>

          {/* Column 5: Marco Legal & Políticas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('footer.transparency')}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/politicas-de-privacidad" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
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
              OpenData © {new Date().getFullYear()} • {t('footer.rights')}
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
