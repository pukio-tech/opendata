'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Icons } from './Icons';

export interface DestinationDetail {
  id: string;
  name: string;
  department: string;
  regionType: 'Sierra' | 'Costa' | 'Selva';
  category: string;
  altitude: string;
  difficulty: string;
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  coordinates: { lat: number; lng: number };
  bestSeason: string;
  activities: string[];
  accessRoute: string;
}

interface DestinationDetailModalProps {
  destination: DestinationDetail | null;
  onClose: () => void;
}

export const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({
  destination,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (destination) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [destination, onClose]);

  if (!destination) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp text-white max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Hero Image Section */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0">
          <img
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105"
            aria-label="Cerrar modal"
          >
            <Icons.X className="w-5 h-5" />
          </button>

          {/* Floating Badges */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {destination.department}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {destination.regionType}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {destination.name}
              </h2>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <Icons.Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-black text-white">{destination.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({destination.reviewsCount})</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Altitud</span>
              <span className="text-sm font-bold text-white flex items-center gap-1">
                <Icons.Layers className="w-3.5 h-3.5 text-sky-400" />
                {destination.altitude}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Dificultad</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Icons.Award className="w-3.5 h-3.5 text-emerald-400" />
                {destination.difficulty}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Mejor Época</span>
              <span className="text-xs font-bold text-amber-400 truncate block">
                {destination.bestSeason}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Georreferencia</span>
              <span className="text-[11px] font-mono font-bold text-slate-300 truncate block">
                {destination.coordinates.lat.toFixed(4)}, {destination.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Icons.Compass className="w-3.5 h-3.5 text-sky-400" />
              Descripción Técnica Oficial
            </h4>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {destination.description}
            </p>
          </div>

          {/* Activities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Actividades Oficiales Permitidas
            </h4>
            <div className="flex flex-wrap gap-2">
              {destination.activities.map((act, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {act}
                </span>
              ))}
            </div>
          </div>

          {/* Access Route */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-amber-400 block mb-1 flex items-center gap-1.5">
              <Icons.Navigation className="w-3.5 h-3.5" />
              Ruta y Acceso Recomendado
            </span>
            <p className="text-slate-400 leading-relaxed">{destination.accessRoute}</p>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>

          <Link
            href={`/turismo?q=${encodeURIComponent(destination.name)}`}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
          >
            <span>Ver Ficha Completa en Catálogo</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
