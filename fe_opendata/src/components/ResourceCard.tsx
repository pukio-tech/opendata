'use client';

import React from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from './Icons';
import { ResourceItem } from '../types/mincetur';
import { getPhotoUrl, API_BASE_URL } from '../services/api';
import { createResourceSlug } from '../utils/slug';
import { useLanguage } from '../context/LanguageContext';
import { translateMinceturText, formatResourceCardDescription, cleanLabel } from '../utils/minceturTranslate';
import { OfficialBadge } from './OfficialBadge';
import { TrustVerificationBadge } from './TrustVerificationBadge';
import { InstitutionalImage } from './InstitutionalImage';

interface ResourceCardProps {
  resource: ResourceItem;
  onSelect?: (resource: ResourceItem) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { language, t } = useLanguage();

  const getResourceImage = (res: ResourceItem): string | null => {
    const raw = res.imagen || res.foto_url;
    if (raw && typeof raw === 'string' && raw.trim()) {
      if (raw.startsWith('http')) return raw.trim();
      const base = API_BASE_URL.replace(/\/api$/, '');
      return `${base}${raw.trim()}`;
    }
    if (res.codigo) {
      return getPhotoUrl(res.codigo);
    }
    return null;
  };

  const photoUrl = getResourceImage(resource);
  const slug = createResourceSlug(resource.nombre, resource.codigo);

  const rawTag = resource.subtipo_categoria || resource.tipo_categoria || resource.categoria || 'Recurso Turístico';
  const categoryTag = translateMinceturText(rawTag, language);
  const cardDescription = formatResourceCardDescription(resource, language);

  return (
    <Link
      href={`/turismo/${slug}`}
      className="group relative rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-xs flex flex-col justify-between select-none h-full"
    >
      <div>
        {/* Photo Container con Fallback Institucional consistente (NUNCA caja negra) */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden">
          <InstitutionalImage
            src={photoUrl}
            alt={resource.nombre}
            category={categoryTag}
            code={resource.codigo}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />

          {/* Top badges institucionales superpuestos */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 text-white border border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-xs">
              {cleanLabel(resource.desdpto || 'Perú')}
            </span>
            <OfficialBadge variant="code">
              {t('card.recordNum')} #{resource.codigo}
            </OfficialBadge>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2">
          {/* Ubicación y Categoría */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
              {cleanLabel(resource.desprov || resource.desubigeo || t('home.verifiedLocation'))}
            </span>
            {categoryTag && (
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                {categoryTag}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0B3B60] dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
            {resource.nombre}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {cardDescription}
          </p>

          {/* Señal de Verificación Oficial */}
          <div className="pt-2">
            <TrustVerificationBadge
              source="MINCETUR"
              seedId={resource.codigo}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#0B3B60] dark:text-sky-400 group-hover:underline flex items-center gap-1.5 transition-colors">
            <span>{t('turismo.viewSheet')}</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </span>

          <span className="p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">
            <Icons.ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};
