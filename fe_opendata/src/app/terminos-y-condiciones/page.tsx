'use client';

import React, { useEffect } from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from '../../components/Icons';
import { useLanguage } from '../../context/LanguageContext';

export default function TerminosYCondicionesPage() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t('terms.title')} | OpenData Perú`;
  }, [t]);

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5">
            <Icons.Compass className="w-4 h-4" />
            <span>{t('nav.inicio')}</span>
          </Link>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{t('terms.title')}</span>
        </nav>

        {/* Header Hero Card */}
        <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm dark:shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Icons.Shield className="w-4 h-4" />
            <span>{t('terms.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
            {t('terms.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {t('terms.heroDesc')}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('terms.s1Title')}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('terms.s1Desc1')}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('terms.s1Desc2')}
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('terms.s2Title')}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('terms.s2Desc1')}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('terms.s2Desc2')}
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('terms.s3Title')}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('terms.s3Desc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">{t('terms.featSearchTitle')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('terms.featSearchDesc')}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">{t('terms.featDesignTitle')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('terms.featDesignDesc')}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">{t('terms.featOpenTitle')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('terms.featOpenDesc')}</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                04
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t('terms.s4Title')}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('terms.s4Desc')}
            </p>
          </section>
        </div>

        {/* Action Button Back */}
        <div className="text-center pt-2">
          <Link
            href="/turismo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            <Icons.Compass className="w-4 h-4" />
            <span>{t('privacy.backCatalog')}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
