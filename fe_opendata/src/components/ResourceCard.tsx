'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

  const getResourceImage = (res: ResourceItem) => {
    if (res.imagen) {
      if (res.imagen.startsWith('http')) return res.imagen;
      const base = API_BASE_URL.replace(/\/api$/, '');
      return `${base}${res.imagen}`;
    }
    return getPhotoUrl(res.codigo);
  };

  const [imgSrc, setImgSrc] = useState<string>(() => getResourceImage(resource));
  const [imgLoading, setImgLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(getResourceImage(resource));
    setImgLoading(true);
    setHasError(false);
  }, [resource.codigo, resource.imagen]);

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
      className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 hover:border-amber-400 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col justify-between select-none h-full"
    >
      <div>
        {/* Photo Container */}
        <div className="relative h-52 sm:h-56 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
          {imgLoading && !hasError && (
            <div className="absolute inset-0 bg-slate-100 animate-pulse flex flex-col items-center justify-center gap-2 z-10">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-semibold text-slate-500">{t('card.loadingPhoto')}</span>
            </div>
          )}

          {!hasError ? (
            <img
              src={imgSrc}
              alt={resource.nombre}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out ${
                imgLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                setImgLoading(false);
                setHasError(false);
              }}
              onError={() => {
                setImgLoading(false);
                setHasError(true);
              }}
              loading="lazy"
            />
          ) : (
            /* Portada Visual Temática Oficial cuando no tiene foto adjunta */
            <div className={`w-full h-full bg-gradient-to-br ${theme.bg} p-5 flex flex-col justify-between relative overflow-hidden border-b ${theme.border}`}>
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-600 uppercase bg-white/90 px-2 py-0.5 rounded-lg border border-slate-200">
                  {t('card.recordNum')} #{resource.codigo}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-white/90 border ${theme.border} ${theme.text}`}>
                  {theme.label}
                </span>
              </div>

              <div className="my-auto text-center z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-2xl bg-white border ${theme.border} ${theme.text} flex items-center justify-center mb-1.5 shadow-md group-hover:scale-110 transition-transform`}>
                  <ThemeIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 tracking-wide">
                  {t('card.inventoryTitle')}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 text-center z-10">
                {t('card.noPhoto')}
              </div>
            </div>
          )}

          {/* Gradient shadow overlay */}
          {!hasError && !imgLoading && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
          )}

          {/* Location at bottom of the photo */}
          {!hasError && !imgLoading && (
            <div className="absolute bottom-3 left-3.5 right-3.5 text-white text-xs font-bold flex items-center gap-1.5 drop-shadow z-20">
              <Icons.MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                {resource.desdpto || 'Perú'} {resource.desprov ? `• ${resource.desprov}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Card Body with perfectly aligned uniform heights */}
        <div className="p-5 sm:p-6 space-y-3">
          {/* 1. Nombre: Altura fija a 2 líneas */}
          <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug h-10 sm:h-11 flex items-start">
            {resource.nombre}
          </h3>

          {/* 2. Descripción: Altura fija a 2 líneas (Traducida según idioma activo) */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed h-8 sm:h-9 flex items-start">
            {cardDescription}
          </p>

          {/* 3. Etiqueta de tipo/subtipo (PRIMERO, sin contorno/borde, traducida) */}
          <div className="h-5 flex items-center">
            {categoryTag ? (
              <span className="text-[11px] font-medium text-amber-700/95 truncate block">
                <DynamicText text={categoryTag} />
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                {t('card.touristResource')}
              </span>
            )}
          </div>

          {/* 4. Ubicación con Icono de Ubicación (ABAJO de la etiqueta) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium h-5">
            <Icons.MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span className="font-semibold text-slate-700 uppercase tracking-wide text-[11px] truncate">
              {resource.desubigeo || resource.desprov || resource.desdpto}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button & Code Footer: Alineados horizontalmente abajo */}
      <div className="p-5 sm:p-6 pt-0">
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
              {t('turismo.inventory')}
            </span>
            <span className="text-xs font-black text-slate-900">{t('card.recordNum')} #{resource.codigo}</span>
          </div>

          <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-400 group-hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all">
            {t('turismo.viewSheet')}
          </div>
        </div>
      </div>
    </Link>
  );
};
