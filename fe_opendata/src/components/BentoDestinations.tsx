'use client';

import React from 'react';
import { Icons } from './Icons';

interface BentoDestinationsProps {
  onSelectDepartment?: (deptCode: string) => void;
  onSelectDept?: (deptCode: string) => void;
  selectedDept?: string;
}

const DESTINATIONS = [
  {
    id: '08', // Cusco
    name: 'Cusco & Valle Sagrado',
    subtitle: 'Arqueología, Trekking y Cultura Inca',
    badge: 'Imperdible',
    bgGradient: 'from-amber-900/80 via-slate-900/60 to-slate-950',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800&auto=format&fit=crop',
    size: 'col-span-1 md:col-span-2 row-span-2',
    tags: ['Trekking', 'Historia', 'Cultura'],
  },
  {
    id: '20', // Piura
    name: 'Piura & Playas del Norte',
    subtitle: 'Manglares, Surf y Aguas Cálidas',
    badge: 'Costa & Sol',
    bgGradient: 'from-sky-900/80 via-slate-900/60 to-slate-950',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
    size: 'col-span-1 md:col-span-1 row-span-1',
    tags: ['Manglares', 'Paseos en Bote'],
  },
  {
    id: '04', // Arequipa
    name: 'Arequipa & Colca',
    subtitle: 'Cañones, Volcanes y Vuelo de Cóndores',
    badge: 'Aventura',
    bgGradient: 'from-orange-950/80 via-slate-900/60 to-slate-950',
    image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=600&auto=format&fit=crop',
    size: 'col-span-1 md:col-span-1 row-span-1',
    tags: ['Cañón del Colca', 'Paisaje'],
  },
  {
    id: '02', // Ancash
    name: 'Áncash & Cordillera Blanca',
    subtitle: 'Lagunas Turquesas y Montañismo',
    badge: 'Alta Montaña',
    bgGradient: 'from-cyan-950/80 via-slate-900/60 to-slate-950',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop',
    size: 'col-span-1 md:col-span-1 row-span-1',
    tags: ['Huascarán', 'Laguna 69'],
  },
  {
    id: '16', // Loreto
    name: 'Loreto & Amazonas',
    subtitle: 'Biodiversidad y Selva Virgen',
    badge: 'Ecoturismo',
    bgGradient: 'from-emerald-950/80 via-slate-900/60 to-slate-950',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=600&auto=format&fit=crop',
    size: 'col-span-1 md:col-span-2 row-span-1',
    tags: ['Río Amazonas', 'Fauna Silvestre'],
  },
];

export const BentoDestinations: React.FC<BentoDestinationsProps> = ({
  onSelectDepartment,
  onSelectDept,
  selectedDept,
}) => {
  return (
    <section className="mb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 mb-2">
            <Icons.Sparkles className="w-4 h-4 text-amber-400" />
            Destinos Emblemáticos
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Descubre las Regiones del Perú
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md">
          Selecciona una de las zonas icónicas para filtrar automáticamente todos sus recursos, fotos y rutas disponibles.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px]">
        {DESTINATIONS.map((dest) => {
          const isSelected = selectedDept === dest.id;
          return (
            <div
              key={dest.id}
              onClick={() => (onSelectDept || onSelectDepartment)?.(isSelected ? '' : dest.id)}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300 ${dest.size} ${
                isSelected
                  ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-2xl scale-[1.01]'
                  : 'border-white/10 hover:border-sky-400/50 hover:shadow-2xl'
              }`}
            >
              {/* Background Photo */}
              <img
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${dest.bgGradient} opacity-85 group-hover:opacity-75 transition-opacity`} />

              {/* Content Box */}
              <div className="relative z-10 h-full p-6 flex flex-col justify-between text-white">
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white tracking-wider uppercase">
                    {dest.badge}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 group-hover:bg-sky-400 group-hover:text-slate-950'
                  }`}>
                    <Icons.ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Title & Subtitle */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-white group-hover:text-amber-300 transition-colors">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-slate-300 mb-3 line-clamp-1">{dest.subtitle}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {dest.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-medium bg-black/40 px-2 py-0.5 rounded-md text-slate-300 border border-white/10">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
