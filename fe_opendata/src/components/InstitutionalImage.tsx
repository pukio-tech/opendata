'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface InstitutionalImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  categoryName?: string;
  code?: number | string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  source?: string;
}

function getCategoryIcon(cat: string = '') {
  const upper = cat.toUpperCase();
  if (upper.includes('NATURAL') || upper.includes('BOSQUE') || upper.includes('LAGUNA') || upper.includes('PLAYA')) {
    return Icons.Trees;
  }
  if (upper.includes('CULTURAL') || upper.includes('ARQUEOL') || upper.includes('TEMPLO') || upper.includes('MUSEO')) {
    return Icons.Layers;
  }
  if (upper.includes('FOLCLORE') || upper.includes('DANZA') || upper.includes('FESTIVIDAD')) {
    return Icons.Award;
  }
  return Icons.Compass;
}

export const InstitutionalImage: React.FC<InstitutionalImageProps> = ({
  src,
  alt,
  category,
  categoryName,
  code,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full',
  priority = false,
  source = 'MINCETUR',
}) => {
  const resolvedCategory = category || categoryName || 'Recurso Turístico';
  const [hasError, setHasError] = useState<boolean>(!src || src.trim() === '');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!src || src.trim() === '') {
      setHasError(true);
      setIsLoaded(false);
    } else {
      setHasError(false);
      setIsLoaded(false);
    }
  }, [src]);

  const CategoryIcon = getCategoryIcon(resolvedCategory);

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-center select-none ${containerClassName}`}
    >
      {/* 1. Imagen Real si existe y carga sin errores */}
      {!hasError && src ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
          )}
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={(e) => {
              if (e.currentTarget.naturalWidth > 0) {
                setIsLoaded(true);
                setHasError(false);
              } else {
                setHasError(true);
              }
            }}
            onError={() => {
              setHasError(true);
              setIsLoaded(false);
            }}
            className={`${className} transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : null}

      {/* 2. Placeholder Institucional Oficial Consistente (Fondo Gris Claro, NUNCA negro) */}
      {hasError && (
        <div className="w-full h-full p-4 flex flex-col justify-between items-center text-center bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 animate-fadeIn">
          {/* Fila superior: Badge de código */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Inventario {source}</span>
            {code && (
              <span className="font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                #{code}
              </span>
            )}
          </div>

          {/* Icono central y categoría */}
          <div className="my-auto flex flex-col items-center py-2">
            <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#0B3B60] dark:text-sky-400 shadow-xs mb-2">
              <CategoryIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
              {resolvedCategory}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Ficha Técnica Oficial
            </span>
          </div>

          {/* Pie del placeholder: Sello de procedencia */}
          <div className="w-full text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1 border-t border-slate-200/80 dark:border-slate-700/60 pt-1.5 font-mono">
            <Icons.Shield className="w-3 h-3 text-slate-400" />
            <span>Registro Nacional Verificado</span>
          </div>
        </div>
      )}
    </div>
  );
};
