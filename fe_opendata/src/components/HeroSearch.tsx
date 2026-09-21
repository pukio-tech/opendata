'use client';

import React from 'react';
import { Icons } from './Icons';
import { ActivityItem, CategoryItem, DepartmentItem } from '../types/mincetur';

interface HeroSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDept: string;
  onDeptChange: (value: string) => void;
  departments: DepartmentItem[];
  categories: CategoryItem[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  activities: ActivityItem[];
  selectedActivity: string;
  onActivitySelect: (id: string) => void;
  onSearchSubmit: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedDept,
  onDeptChange,
  departments,
  categories,
  selectedCategory,
  onCategoryChange,
  activities,
  selectedActivity,
  onActivitySelect,
  onSearchSubmit,
}) => {
  return (
    <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
      {/* Background Image Hero with Dark Luxury Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1920&auto=format&fit=crop"
          alt="Peru Landscapes"
          className="w-full h-full object-cover opacity-35 scale-105 animate-pulse duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/60" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 text-center w-full">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 mb-8 tracking-widest uppercase shadow-lg">
          <Icons.Compass className="w-4 h-4 text-amber-400" />
          <span>Inventario Turístico Nacional del Perú</span>
        </div>

        {/* Big Bold Headline matching image 1 ("EXPLORE HIKING / PERÚ") */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
            EXPLORE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-sky-400">PERÚ</span>
          </h1>
          <p className="mt-4 text-sm sm:text-lg text-slate-300 font-medium max-w-2xl mx-auto drop-shadow">
            Catálogo georreferenciado con más de 5,000 sitios naturales, rutas de trekking, costas y patrimonio cultural del Perú.
          </p>
        </div>

        {/* Floating Multi-field Filter Search Capsule (Inspired by Image 1) */}
        <div className="max-w-5xl mx-auto glass-search p-3 sm:p-4 rounded-3xl shadow-2xl border border-white/20 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Field 1: Locations */}
            <div className="bg-slate-900/90 hover:bg-slate-900 p-3 rounded-2xl border border-slate-700/80 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                <Icons.MapPin className="w-3.5 h-3.5" />
                <span>Región / Ubicación</span>
              </div>
              <select
                value={selectedDept}
                onChange={(e) => onDeptChange(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Todas las regiones (25)</option>
                {departments.map((d) => (
                  <option key={d.iddpto} value={d.iddpto} className="bg-slate-900 text-white">
                    {d.departamento} (Ubigeo {d.iddpto})
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Activities */}
            <div className="bg-slate-900/90 hover:bg-slate-900 p-3 rounded-2xl border border-slate-700/80 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <Icons.Compass className="w-3.5 h-3.5" />
                <span>Actividad Turística</span>
              </div>
              <select
                value={selectedActivity}
                onChange={(e) => onActivitySelect(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Todas las actividades</option>
                {activities.map((a) => (
                  <option key={a.atrac_acti} value={a.atrac_acti} className="bg-slate-900 text-white">
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Categories */}
            <div className="bg-slate-900/90 hover:bg-slate-900 p-3 rounded-2xl border border-slate-700/80 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <Icons.Layers className="w-3.5 h-3.5" />
                <span>Categoría de Atractivo</span>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.atrac_categ} value={c.atrac_categ} className="bg-slate-900 text-white">
                    {c.categoria}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 4: Text Search + Button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900/90 hover:bg-slate-900 p-3 rounded-2xl border border-slate-700/80 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Icons.Search className="w-3.5 h-3.5" />
                  <span>Palabra Clave</span>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                  placeholder="Ej: Lauricocha, Colca..."
                  className="w-full bg-transparent text-white placeholder-slate-500 text-xs font-medium focus:outline-none"
                />
              </div>

              <button
                onClick={onSearchSubmit}
                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-lg hover:shadow-sky-500/25 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>Buscar</span>
                <Icons.ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills matching luxury travel site */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
            Populares:
          </span>
          {activities.slice(0, 5).map((act) => (
            <button
              key={act.atrac_acti}
              onClick={() => onActivitySelect(selectedActivity === String(act.atrac_acti) ? '' : String(act.atrac_acti))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedActivity === String(act.atrac_acti)
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'
              }`}
            >
              {act.nombre}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
