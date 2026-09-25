'use client';

import React, { useEffect, useRef } from 'react';

interface AdsterraNativeBannerProps {
  className?: string;
  label?: string;
}

export const AdsterraNativeBanner: React.FC<AdsterraNativeBannerProps> = ({
  className = '',
  label = 'Contenido Recomendado',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Limpiar cualquier nodo previo para evitar duplicados en re-renders o navegación SPA
    currentContainer.innerHTML = '';

    // Crear el div contenedor con el ID requerido por Adsterra
    const adContainer = document.createElement('div');
    adContainer.id = 'container-79d32db6a63a12e5f3aac99fe6ea4f56';
    currentContainer.appendChild(adContainer);

    // Crear y adjuntar el script invoke.js
    const script = document.createElement('script');
    script.src = 'https://pl31508083.profitableratecpmnetwork.com/79d32db6a63a12e5f3aac99fe6ea4f56/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <aside
      aria-label="Publicidad y recomendaciones"
      className={`w-full my-8 ${className}`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm backdrop-blur-sm transition-all overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-mono tracking-wider uppercase">
            <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              {label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 font-medium">
              Publicidad
            </span>
          </div>

          <div
            ref={containerRef}
            className="w-full min-h-[140px] flex items-center justify-center overflow-x-auto text-slate-400 text-xs"
          />
        </div>
      </div>
    </aside>
  );
};
