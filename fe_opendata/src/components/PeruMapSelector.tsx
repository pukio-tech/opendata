'use client';

import React from 'react';
import { DepartmentItem } from '../types/mincetur';
import { Icons } from './Icons';

interface PeruMapSelectorProps {
  departments: DepartmentItem[];
  selectedDept: string;
  onSelectDept: (id: string) => void;
}

export const PeruMapSelector: React.FC<PeruMapSelectorProps> = ({
  departments,
  selectedDept,
  onSelectDept,
}) => {
  return (
    <div id="mapa" className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 mb-1">
            <Icons.MapPin className="w-4 h-4" />
            División Política
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Explora por Región o Departamento
          </h2>
        </div>
        {selectedDept && (
          <button
            onClick={() => onSelectDept('')}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <Icons.X className="w-3.5 h-3.5" />
            <span>Ver todo el Perú</span>
          </button>
        )}
      </div>

      {/* Grid of Departments Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {departments.map((dept) => {
          const isSelected = selectedDept === dept.iddpto;
          return (
            <button
              key={dept.iddpto}
              onClick={() => onSelectDept(isSelected ? '' : dept.iddpto)}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between group ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]'
                  : 'bg-slate-50 hover:bg-amber-50/60 border-slate-200/80 text-slate-700 hover:border-amber-300'
              }`}
            >
              <div>
                <span className={`block text-[10px] font-bold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                  UBIGEO {dept.iddpto}
                </span>
                <span className="text-xs font-bold truncate block">{dept.departamento}</span>
              </div>
              <Icons.ArrowRight
                className={`w-3.5 h-3.5 transition-transform ${
                  isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
