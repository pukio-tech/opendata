'use client';

import React from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from './Icons';
import { MuseoItem } from '../types/museo';
import { useLanguage } from '../context/LanguageContext';
import { InstitutionalImage } from './InstitutionalImage';
import { OfficialBadge } from './OfficialBadge';

interface MuseoCardProps {
  museo: MuseoItem;
}

export const MuseoCard: React.FC<MuseoCardProps> = ({ museo }) => {
  const { t } = useLanguage();

  const imgSrc =
    museo.imagen_tarjeta ||
    museo.imagen_portada ||
    (museo.galeria && museo.galeria[0]?.url) ||
    '';

  const isOpen = (museo.estado || 'Abierto').toLowerCase().includes('abierto');
  const hasVirtualTour = Boolean(museo.recorrido_virtual_url);
  const categoryTag = museo.administracion || museo.categoria || 'Ministerio de Cultura';
  const locationLabel =
    [museo.departamento, museo.provincia, museo.distrito].filter(Boolean).join(' • ') || 'Perú';

  return (
    <Link
      href={`/museos/${museo.slug}`}
      className="group relative rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0B3B60]/40 dark:hover:border-slate-700 transition-all duration-200 shadow-xs flex flex-col justify-between select-none h-full"
    >
      <div>
        {/* Photo Container */}
        <div className="relative h-52 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          <InstitutionalImage
            src={imgSrc}
            alt={museo.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ease-out"
            containerClassName="w-full h-full"
            category={museo.categoria || 'Museo'}
            code={museo.id_museo}
            source="MINCUL"
          />

          {/* Gradient shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20">
            <OfficialBadge variant="code">
              {museo.departamento || 'Perú'}
            </OfficialBadge>

            <div className="flex items-center gap-1.5">
              {hasVirtualTour && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold shadow-xs">
                  <Icons.Eye className="w-3 h-3" />
                  <span>360°</span>
                </span>
              )}
              <OfficialBadge variant={isOpen ? 'activo' : 'nohabido'}>
                ● {museo.estado || 'Abierto'}
              </OfficialBadge>
            </div>
          </div>

          {/* Category tag at bottom of photo */}
          {categoryTag && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20">
              <OfficialBadge variant="code" className="truncate max-w-[220px]">
                {categoryTag}
              </OfficialBadge>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
            {locationLabel}
          </span>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0B3B60] dark:group-hover:text-white transition-colors line-clamp-2 leading-snug">
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
          <span className="font-semibold text-[#0B3B60] dark:text-slate-300 group-hover:underline flex items-center gap-1.5 transition-colors">
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

