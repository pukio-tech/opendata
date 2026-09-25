'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from './Icons';
import { ResourceItem } from '../types/mincetur';
import { getPhotoUrl, API_BASE_URL } from '../services/api';
import { createResourceSlug } from '../utils/slug';
import { useLanguage } from '../context/LanguageContext';
import { translateMinceturText, formatResourceCardDescription, cleanLabel } from '../utils/minceturTranslate';
import { DynamicText } from '../utils/dynamicTranslate';

interface ResourceCardProps {
  resource: ResourceItem;
  onSelect?: (resource: ResourceItem) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { language, t } = useLanguage();
  const imgRef = useRef<HTMLImageElement | null>(null);

  const getResourceImage = (res: ResourceItem): string | null => {
    const raw = res.imagen || res.foto_url;
    if (raw && typeof raw === 'string' && raw.trim()) {
      if (raw.startsWith('http')) return raw.trim();
      const base = API_BASE_URL.replace(/\/api$/, '');
      return `${base}${raw.trim()}`;
    }
    return getPhotoUrl(res.codigo);
  };

  const initialImg = getResourceImage(resource);
  const [imgSrc, setImgSrc] = useState<string | null>(initialImg);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const img = getResourceImage(resource);
    setImgSrc(img);
    setHasError(false);

    // Verificar si la imagen ya está lista en el caché del navegador
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    } else {
      setIsLoaded(false);
    }
  }, [resource.codigo, resource.imagen, resource.foto_url]);

  const slug = createResourceSlug(resource.nombre, resource.codigo);

  const cat = (resource.categoria || '').toUpperCase();
  const sub = (resource.subtipo_categoria || resource.tipo_categoria || '').toUpperCase();

  const getCategoryTheme = () => {
    if (sub.includes('MUSEO') || sub.includes('PINACOTECA')) {
      return {
        bg: 'from-amber-100 via-amber-50 to-white',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: Icons.Award,
        label: t('card.themeMuseum'),
      };
    }
    if (sub.includes('ARQUEOL') || sub.includes('TEMPLO') || sub.includes('FORTALEZA') || cat.includes('CULTURAL')) {
      return {
        bg: 'from-indigo-100 via-indigo-50 to-white',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        icon: Icons.Layers,
        label: t('card.themeCultural'),
      };
    }
    if (sub.includes('MALEC') || sub.includes('PLAYA') || sub.includes('RIO') || sub.includes('AGUA') || sub.includes('LAGUNA') || sub.includes('CATARATA')) {
      return {
        bg: 'from-sky-100 via-sky-50 to-white',
        border: 'border-sky-200',
        text: 'text-sky-700',
        icon: Icons.Compass,
        label: t('card.themeWater'),
      };
    }
    if (sub.includes('CAVERNA') || sub.includes('CUEVA') || sub.includes('GRUTA') || sub.includes('CERRO') || sub.includes('CORDILLERA')) {
      return {
        bg: 'from-emerald-100 via-emerald-50 to-white',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: Icons.Navigation,
        label: t('card.themeNature'),
      };
    }
    return {
      bg: 'from-slate-100 via-slate-50 to-white',
      border: 'border-slate-200',
      text: 'text-slate-700',
      icon: Icons.Compass,
      label: t('card.themeGeneral'),
    };
  };

  const theme = getCategoryTheme();
  const ThemeIcon = theme.icon;

  const rawTag = resource.subtipo_categoria || resource.tipo_categoria || resource.categoria;
  const categoryTag = translateMinceturText(rawTag, language);
  const cardDescription = formatResourceCardDescription(resource, language);

  return (
    <Link
      href={`/turismo/${slug}`}
      className="group relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-slate-700 transition-all duration-200 shadow-sm dark:shadow-none flex flex-col justify-between select-none h-full"
    >
      <div>
        {/* Photo Container */}
        <div className="relative h-52 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          {/* Skeleton sutil de fondo */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
          )}

          {!hasError && imgSrc ? (
            <img
              ref={imgRef}
              src={imgSrc}
              alt={resource.nombre}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ease-out ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth > 0) {
                  setIsLoaded(true);
                  setHasError(false);
                } else {
                  setIsLoaded(false);
                  setHasError(true);
                }
              }}
              onError={() => {
                setIsLoaded(false);
                setHasError(true);
              }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            /* Portada Visual Temática Oficial cuando no tiene foto o tarda en responder */
            <div className={`w-full h-full bg-slate-900 p-5 flex flex-col justify-between relative overflow-hidden border-b border-slate-800 animate-fadeIn`}>
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                  {t('card.recordNum')} #{resource.codigo}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-sky-400">
                  {theme.label}
                </span>
              </div>

              <div className="my-auto text-center z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center mb-1.5 shadow group-hover:scale-110 transition-transform">
                  <ThemeIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-300 tracking-wide">
                  {t('card.inventoryTitle')}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 text-center z-10">
                {t('card.noPhoto')}
              </div>
            </div>
          )}

          {/* Gradient shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-white z-20">
            <span className="px-2.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
              {cleanLabel(resource.desdpto || 'Perú')}
            </span>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/90 text-amber-400 border border-slate-700">
              {t('card.recordNum')} #{resource.codigo}
            </span>
          </div>

          {/* Category tag at bottom of photo */}
          {categoryTag && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 border border-slate-700 text-sky-300 truncate max-w-[220px] inline-block">
                {categoryTag}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5">
            {cleanLabel(resource.desprov || resource.desubigeo || t('home.verifiedLocation'))}
          </span>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
            {resource.nombre}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {cardDescription}
          </p>
        </div>
      </div>

      {/* Action Button & Code Footer */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-500 flex items-center gap-1.5 transition-colors">
            <span>{t('turismo.viewSheet')}</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </span>

          <span className="p-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">
            <Icons.ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};
