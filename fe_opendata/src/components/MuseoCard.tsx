'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from './Icons';
import { MuseoItem } from '../types/museo';
import { useLanguage } from '../context/LanguageContext';

interface MuseoCardProps {
  museo: MuseoItem;
}

export const MuseoCard: React.FC<MuseoCardProps> = ({ museo }) => {
  const { t } = useLanguage();
  const imgRef = useRef<HTMLImageElement | null>(null);

  const rawImg = museo.imagen_tarjeta || museo.imagen_portada || (museo.galeria && museo.galeria[0]?.url) || null;
  const [imgSrc, setImgSrc] = useState<string | null>(rawImg);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const img = museo.imagen_tarjeta || museo.imagen_portada || (museo.galeria && museo.galeria[0]?.url) || null;
    setImgSrc(img);
    setHasError(false);

    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    } else {
      setIsLoaded(false);
    }
  }, [museo.id_museo, museo.imagen_tarjeta, museo.imagen_portada, museo.galeria]);

  const isOpen = (museo.estado || 'Abierto').toLowerCase().includes('abierto');
  const hasVirtualTour = Boolean(museo.recorrido_virtual_url);
  const categoryTag = museo.administracion || museo.categoria || 'Ministerio de Cultura';
  const locationLabel = [museo.departamento, museo.provincia, museo.distrito].filter(Boolean).join(' • ') || 'Perú';

  return (
    <Link
      href={`/museos/${museo.slug}`}
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
              alt={museo.nombre}
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
            /* Portada Visual Temática Oficial cuando no tiene foto */
            <div className="w-full h-full bg-slate-900 p-5 flex flex-col justify-between relative overflow-hidden border-b border-slate-800 animate-fadeIn">
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                  {museo.departamento || 'Perú'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isOpen
                    ? 'bg-emerald-950/90 text-emerald-400 border-emerald-700/60'
                    : 'bg-rose-950/90 text-rose-400 border-rose-700/60'
                }`}>
                  {museo.estado || 'Abierto'}
                </span>
              </div>

              <div className="my-auto text-center z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center mb-1.5 shadow group-hover:scale-110 transition-transform">
                  <Icons.Building className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-300 tracking-wide">
                  Museos del Perú
                </span>
              </div>

              <div className="text-[10px] text-slate-500 text-center z-10">
                Inventario Oficial de Museos
              </div>
            </div>
          )}

          {/* Gradient shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-white z-20">
            <span className="px-2.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
              {museo.departamento || 'Perú'}
            </span>

            <div className="flex items-center gap-1.5">
              {hasVirtualTour && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold shadow-sm">
                  <Icons.Eye className="w-3 h-3" />
                  <span>360°</span>
                </span>
              )}
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border backdrop-blur-sm ${
                  isOpen
                    ? 'bg-emerald-900/90 text-emerald-200 border-emerald-700/60'
                    : 'bg-rose-900/90 text-rose-200 border-rose-700/60'
                }`}
              >
                {museo.estado || 'Abierto'}
              </span>
            </div>
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
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
            {locationLabel}
          </span>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
            {museo.nombre}
          </h3>

          {museo.descripcion && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {museo.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Action Button & Code Footer */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-500 flex items-center gap-1.5 transition-colors">
            <span>{t('turismo.viewSheet') || 'Ver ficha y tarifas'}</span>
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
