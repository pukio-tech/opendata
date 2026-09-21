'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from './Icons';
import { ResourceItem } from '../types/mincetur';
import { getPhotoUrl, API_BASE_URL } from '../services/api';
import { createResourceSlug } from '../utils/slug';

interface ResourceCardProps {
  resource: ResourceItem;
  onSelect?: (resource: ResourceItem) => void;
}

function cleanLabel(text: string | null | undefined): string {
  if (!text) return '';
  let cleaned = text
    .replace(/^[0-9a-zA-Z]{1,3}[\.\)\-]\s*/, '')
    .replace(/^[\.\-\/\s]+/, '')
    .trim();

  if (!cleaned) cleaned = text.trim();

  const prepositions = ['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'e', 'o', 'u', 'por', 'con', 'al'];
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onSelect }) => {
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

  // Sincronizar imagen al cambiar de código o cambios en el recurso
  useEffect(() => {
    setImgSrc(getResourceImage(resource));
    setImgLoading(true);
    setHasError(false);
  }, [resource.codigo, resource.imagen]);

  const slug = createResourceSlug(resource.nombre, resource.codigo);

  const cat = (resource.categoria || '').toUpperCase();
  const sub = (resource.subtipo_categoria || resource.tipo_categoria || '').toUpperCase();

  // Obtener estilo temático preciso para recursos sin foto digitalizada
  const getCategoryTheme = () => {
    if (sub.includes('MUSEO') || sub.includes('PINACOTECA')) {
      return {
        bg: 'from-amber-950 via-slate-900 to-slate-950',
        border: 'border-amber-500/30',
        text: 'text-amber-300',
        icon: Icons.Award,
        label: 'Museo y Exposición',
      };
    }
    if (sub.includes('ARQUEOL') || sub.includes('TEMPLO') || sub.includes('FORTALEZA') || cat.includes('CULTURAL')) {
      return {
        bg: 'from-indigo-950 via-slate-900 to-slate-950',
        border: 'border-indigo-500/30',
        text: 'text-indigo-300',
        icon: Icons.Layers,
        label: 'Patrimonio Cultural',
      };
    }
    if (sub.includes('MALEC') || sub.includes('PLAYA') || sub.includes('RIO') || sub.includes('AGUA') || sub.includes('LAGUNA') || sub.includes('CATARATA')) {
      return {
        bg: 'from-sky-950 via-slate-900 to-slate-950',
        border: 'border-sky-500/30',
        text: 'text-sky-300',
        icon: Icons.Compass,
        label: 'Cuerpo de Agua / Costa',
      };
    }
    if (sub.includes('CAVERNA') || sub.includes('CUEVA') || sub.includes('GRUTA') || sub.includes('CERRO') || sub.includes('CORDILLERA')) {
      return {
        bg: 'from-emerald-950 via-slate-900 to-slate-950',
        border: 'border-emerald-500/30',
        text: 'text-emerald-300',
        icon: Icons.Navigation,
        label: 'Formación Natural',
      };
    }
    return {
      bg: 'from-slate-900 via-slate-950 to-slate-950',
      border: 'border-slate-700/50',
      text: 'text-slate-300',
      icon: Icons.Compass,
      label: 'Recurso Turístico',
    };
  };

  const theme = getCategoryTheme();
  const ThemeIcon = theme.icon;

  return (
    <Link
      href={`/turismo/${slug}`}
      className="group relative rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col select-none"
    >
      {/* Photo / Category Container */}
      <div className="relative h-56 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Skeleton Loader gris mientras la imagen se está descargando */}
        {imgLoading && !hasError && (
          <div className="absolute inset-0 bg-slate-800/90 animate-pulse flex flex-col items-center justify-center gap-2 z-10">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-semibold text-slate-400">Cargando fotografía oficial...</span>
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
          <div className={`w-full h-full bg-gradient-to-br ${theme.bg} p-6 flex flex-col justify-between relative overflow-hidden border-b ${theme.border}`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
                Ficha #{resource.codigo}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-900/80 border ${theme.border} ${theme.text}`}>
                {theme.label}
              </span>
            </div>

            <div className="my-auto text-center z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-2xl bg-slate-900/90 border ${theme.border} ${theme.text} flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                <ThemeIcon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wide">
                Inventario Turístico Nacional
              </span>
            </div>

            <div className="text-[10px] text-slate-500 text-center z-10">
              Sin fotografía digitalizada en ficha oficial
            </div>
          </div>
        )}

        {/* Gradient shadow overlay */}
        {!hasError && !imgLoading && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
        )}

        {/* Category Tag Top-Left */}
        {!hasError && !imgLoading && (
          <div className="absolute top-3.5 left-3.5 bg-slate-900/85 backdrop-blur-md text-sky-300 border border-white/10 text-[10px] font-bold px-2.5 py-1 rounded-xl tracking-wider z-20">
            {cleanLabel(resource.subtipo_categoria || resource.tipo_categoria || resource.categoria) || 'Atractivo'}
          </div>
        )}

        {/* Location at bottom-left */}
        {!hasError && !imgLoading && (
          <div className="absolute bottom-3 left-3.5 right-3.5 text-white text-xs font-bold flex items-center gap-1.5 drop-shadow z-20">
            <Icons.MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="truncate">
              {resource.desdpto || 'Perú'} {resource.desprov ? `• ${resource.desprov}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug mb-2">
            {resource.nombre}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {resource.categoria ? `${resource.categoria}. ` : ''}
            {resource.desubigeo ? `Distrito de ${resource.desubigeo}, provincia de ${resource.desprov}.` : ''}
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2 font-medium">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Icons.Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>{resource.desubigeo || resource.desprov || resource.desdpto}</span>
            </span>
          </div>
        </div>

        {/* Action Button & Code Footer (Matching Image 2) */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Inventario</span>
            <span className="text-xs font-black text-white">Ficha #{resource.codigo}</span>
          </div>

          <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-400 group-hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all">
            Ver Ficha
          </div>
        </div>
      </div>
    </Link>
  );
};

