'use client';

import React, { useState } from 'react';
import { Link } from 'next-view-transitions';
import { Icons } from './Icons';
import { EmpresaListItem } from '../types/empresa';

interface EmpresaCardProps {
  empresa: EmpresaListItem;
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

  // Paleta de gradiente según tipo societario
  const getCardTheme = () => {
    const tipo = (empresa.tipo_contribuyente || '').toUpperCase();
    if (tipo.includes('ANONIMA') || tipo.includes('S.A.')) {
      return {
        gradient: 'from-sky-700 via-indigo-800 to-slate-900',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
        iconColor: 'text-sky-400',
      };
    }
    if (tipo.includes('INDIVIDUAL') || tipo.includes('E.I.R.L')) {
      return {
        gradient: 'from-teal-700 via-emerald-800 to-slate-900',
        badge: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
        iconColor: 'text-teal-400',
      };
    }
    if (tipo.includes('ASOCIACION') || tipo.includes('COMUNIDAD')) {
      return {
        gradient: 'from-amber-700 via-orange-800 to-slate-900',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        iconColor: 'text-amber-400',
      };
    }
    return {
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      badge: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
      iconColor: 'text-slate-400',
    };
  };

  const theme = getCardTheme();
  const ubigeoTexto = [empresa.distrito, empresa.departamento].filter(Boolean).join(', ') || 'Perú';

  return (
    <Link
      href={`/empresas/${slug}`}
      className="group relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-slate-700 transition-all duration-200 shadow-sm dark:shadow-none flex flex-col justify-between select-none h-full"
    >
      <div>
        {/* Cabecera visual con estilo tarjeta institucional */}
        <div className={`relative h-44 w-full bg-gradient-to-br ${theme.gradient} overflow-hidden p-4 flex flex-col justify-between text-white`}>
          {/* Patrón sutil decorativo */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Fila superior: RUC badge con copy y Estado */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyRuc}
              title="Copiar RUC"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/70 hover:bg-slate-950 border border-white/20 text-[11px] font-mono font-bold text-white transition-colors backdrop-blur-md cursor-pointer"
            >
              <span>{empresa.ruc}</span>
              {copied ? (
                <span className="text-[10px] text-emerald-400 font-sans">✓</span>
              ) : (
                <Icons.Copy className="w-3 h-3 text-slate-300" />
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                {empresa.estado_contribuyente}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 backdrop-blur-md">
                {empresa.condicion_domicilio}
              </span>
            </div>
          </div>

          {/* Centro: Icono corporativo e iniciales */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Icons.Building className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-mono text-slate-300 block truncate">
                {empresa.codigo_ciiu ? `CIIU ${empresa.codigo_ciiu}` : 'CONTRIBUYENTE SUNAT'}
              </span>
              <span className="text-xs font-bold text-white block truncate">
                {empresa.nombre_comercial || empresa.departamento || 'PERÚ'}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido de la tarjeta */}
        <div className="p-4 space-y-2.5">
          {/* Tag de Tipo Societario */}
          {empresa.tipo_contribuyente && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 line-clamp-1 border border-slate-200 dark:border-slate-700">
              {empresa.tipo_contribuyente}
            </span>
          )}

          {/* Razón Social */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
            {empresa.razon_social}
          </h3>

          {/* Actividad Económica */}
          {empresa.actividad_economica && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {empresa.actividad_economica}
            </p>
          )}
        </div>
      </div>

      {/* Footer de la tarjeta con ubicación */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate pr-2">
          <Icons.MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate font-medium">{ubigeoTexto}</span>
        </div>

        {empresa.fecha_inicio_actividades && (
          <span className="font-mono text-[10px] text-slate-400 shrink-0">
            {empresa.fecha_inicio_actividades.slice(0, 4)}
          </span>
        )}
      </div>
    </Link>
  );
};
