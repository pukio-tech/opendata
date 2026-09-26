'use client';

import React, { useState } from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from './Icons';
import { EmpresaListItem } from '../types/empresa';
import { OfficialBadge, BadgeVariant } from './OfficialBadge';
import { TrustVerificationBadge } from './TrustVerificationBadge';

interface EmpresaCardProps {
  empresa: EmpresaListItem;
}

function getStatusVariant(status: string | undefined): BadgeVariant {
  const s = (status || '').toUpperCase();
  if (s.includes('ACTIVO') || s.includes('HABIDO')) return 'activo';
  if (s.includes('PENDIENTE') || s.includes('SUSPENSION') || s.includes('REVISION')) return 'pendiente';
  if (s.includes('NO HABIDO') || s.includes('BAJA') || s.includes('NO HALLADO')) return 'nohabido';
  return 'neutral';
}

export const EmpresaCard: React.FC<EmpresaCardProps> = ({ empresa }) => {
  const [copied, setCopied] = useState(false);
  const slug = empresa.url_empresa || empresa.ruc;

  const handleCopyRuc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(empresa.ruc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusVariant = getStatusVariant(empresa.estado_contribuyente);
  const condicionVariant = getStatusVariant(empresa.condicion_domicilio);
  const ubigeoTexto = [empresa.distrito, empresa.departamento].filter(Boolean).join(', ') || 'Perú';

  return (
    <Link
      href={`/empresas/${slug}`}
      className="group relative rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-xs flex flex-col justify-between select-none h-full"
    >
      <div>
        {/* Cabecera Neutra Institucional (Gris claro / Slate neutro, SIN gradientes decorativos) */}
        <div className="relative w-full bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 p-3.5 space-y-3">
          {/* Fila superior: RUC badge con copy y Badges Semánticos de Estado */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyRuc}
              title="Copiar RUC oficial"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] font-mono font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>RUC {empresa.ruc}</span>
              {copied ? (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">✓</span>
              ) : (
                <Icons.Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {/* Badges de estado: Los ÚNICOS elementos con color semántico real */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <OfficialBadge variant={statusVariant}>
                {empresa.estado_contribuyente || 'ACTIVO'}
              </OfficialBadge>
              {empresa.condicion_domicilio && (
                <OfficialBadge variant={condicionVariant}>
                  {empresa.condicion_domicilio}
                </OfficialBadge>
              )}
            </div>
          </div>

          {/* Fila de CIIU e Identificación */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold truncate">
              {empresa.codigo_ciiu ? `CIIU ${empresa.codigo_ciiu}` : 'CONTRIBUYENTE SUNAT'}
            </span>
            <span className="truncate uppercase font-medium text-slate-500 dark:text-slate-400">
              {empresa.departamento || 'PERÚ'}
            </span>
          </div>
        </div>

        {/* Contenido de la tarjeta */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {/* Tipo Societario */}
          {empresa.tipo_contribuyente && (
            <span className="inline-block text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-full">
              {empresa.tipo_contribuyente}
            </span>
          )}

          {/* Razón Social */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0B3B60] dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
            {empresa.razon_social}
          </h3>

          {/* Actividad Económica */}
          {empresa.actividad_economica && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {empresa.actividad_economica}
            </p>
          )}

          {/* Señal de Verificación Oficial SUNAT */}
          <div className="pt-2">
            <TrustVerificationBadge
              source="SUNAT"
              seedId={empresa.ruc}
            />
          </div>
        </div>
      </div>

      {/* Footer de la tarjeta con ubicación y fecha de actividades */}
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate pr-2">
          <Icons.MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate font-medium">{ubigeoTexto}</span>
        </div>

        {empresa.fecha_inicio_actividades && (
          <span className="font-mono text-[10px] text-slate-400 shrink-0" title="Año inicio de actividades">
            Inicio: {empresa.fecha_inicio_actividades.slice(0, 4)}
          </span>
        )}
      </div>
    </Link>
  );
};
