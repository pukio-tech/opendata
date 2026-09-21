'use client';

import React from 'react';
import { Icons } from './Icons';
import { ActivityItem, CategoryItem, DepartmentItem } from '../types/mincetur';

interface FilterBarProps {
  categories: CategoryItem[];
  activities: ActivityItem[];
  departments: DepartmentItem[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  selectedActivity: string;
  onActivityChange: (id: string) => void;
  selectedSubActivity: string;
  onSubActivityChange: (id: string) => void;
  selectedDept: string;
  onDeptChange: (id: string) => void;
  totalResults: number;
  onResetFilters: () => void;
  viewMode: 'grid' | 'map';
  onViewModeChange: (mode: 'grid' | 'map') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  activities,
  departments,
  selectedCategory,
  onCategoryChange,
  selectedActivity,
  onActivityChange,
  selectedSubActivity,
  onSubActivityChange,
  selectedDept,
  onDeptChange,
  totalResults,
  onResetFilters,
  viewMode,
  onViewModeChange,
}) => {
  const activeActivityObj = activities.find((a) => String(a.atrac_acti) === selectedActivity);
  const subActivities = activeActivityObj?.sub_actividades || [];

  const hasActiveFilters = Boolean(selectedCategory || selectedActivity || selectedSubActivity || selectedDept);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Explorador de Recursos Turísticos</h2>
          </div>
          <p className="text-xs text-slate-400">
            {totalResults} {totalResults === 1 ? 'sitio turístico encontrado' : 'sitios turísticos encontrados'}
          </p>
        </div>

        {/* Reset Filters */}
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3.5 py-1.5 rounded-xl hover:bg-rose-950/40 border border-rose-900/40 transition-colors flex items-center gap-1.5"
            >
              <Icons.X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Selects Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {/* Región */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Departamento
          </label>
          <select
            value={selectedDept}
            onChange={(e) => onDeptChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
          >
            <option value="">Todos los departamentos (25)</option>
            {departments.map((d) => (
              <option key={d.iddpto} value={d.iddpto}>
                {d.departamento} (Ubigeo {d.iddpto})
              </option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.atrac_categ} value={c.atrac_categ}>
                {c.categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Actividad Principal */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Actividad
          </label>
          <select
            value={selectedActivity}
            onChange={(e) => {
              onActivityChange(e.target.value);
              onSubActivityChange('');
            }}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
          >
            <option value="">Todas las actividades</option>
            {activities.map((a) => (
              <option key={a.atrac_acti} value={a.atrac_acti}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Actividad */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Sub-Actividad
          </label>
          <select
            value={selectedSubActivity}
            onChange={(e) => onSubActivityChange(e.target.value)}
            disabled={!selectedActivity || subActivities.length === 0}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="">Todas las sub-actividades</option>
            {subActivities.map((s) => (
              <option key={s.id} value={s.atrac_acti_tipo || ''}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
