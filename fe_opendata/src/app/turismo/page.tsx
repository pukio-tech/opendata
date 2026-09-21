'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiService } from '../../services/api';
import {
  ActivityItem,
  CategoryItem,
  DepartmentItem,
  ResourceItem,
} from '../../types/mincetur';
import { ResourceCard } from '../../components/ResourceCard';
import { Pagination } from '../../components/Pagination';
import { Icons } from '../../components/Icons';
import { useLanguage } from '../../context/LanguageContext';
import { translateMinceturText } from '../../utils/minceturTranslate';

export default function TurismoPage() {
  const { language, t } = useLanguage();

  // Datos base
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Estados de Filtros en Formulario
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [searchCode, setSearchCode] = useState<string>('');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState<boolean>(false);

  // Estados de Filtros Aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    dept: '',
    category: '',
    activity: '',
    code: '',
  });

  // Estados de Recursos y Paginación
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Carga inicial de catálogos
  useEffect(() => {
    Promise.all([
      apiService.getDepartments().catch(() => []),
      apiService.getCategories().catch(() => []),
      apiService.getActivities().catch(() => []),
    ]).then(([deps, cats, acts]) => {
      setDepartments(deps);
      setCategories(cats);
      setActivities(acts);
    });
  }, []);

  // Función de consulta de recursos (usando los filtros aplicados)
  const fetchResources = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      try {
        const rawCode = appliedFilters.code.trim();
        const codeFilter = rawCode ? Number(rawCode) : undefined;
        const searchVal = appliedFilters.search.trim();

        const effectiveCode = !isNaN(Number(codeFilter))
          ? codeFilter
          : /^\d+$/.test(searchVal)
          ? Number(searchVal)
          : undefined;

        const res = await apiService.getResources({
          page: currentPage,
          limit: 12,
          q: searchVal || undefined,
          codigo: effectiveCode,
          iddpto: appliedFilters.dept || undefined,
          categoria: appliedFilters.category || undefined,
          actividad: appliedFilters.activity || undefined,
        });

        setResources(res.data || []);
        setTotal(res.total);
        setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / 12)));
      } catch (error) {
        console.error('Error al cargar recursos turísticos:', error);
        setResources([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    fetchResources(page);
  }, [fetchResources, page]);

  // Manejar búsqueda
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      search: searchTerm,
      dept: selectedDept,
      category: selectedCategory,
      activity: selectedActivity,
      code: searchCode,
    });
    setPage(1);
    const el = document.getElementById('listado-atractivos');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedCategory('');
    setSelectedActivity('');
    setSearchCode('');
    setAppliedFilters({
      search: '',
      dept: '',
      category: '',
      activity: '',
      code: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
      appliedFilters.dept ||
      appliedFilters.category ||
      appliedFilters.activity ||
      appliedFilters.code
  );

  return (
    <main className="flex-1 bg-white text-slate-900 pb-20">
      {/* Hero Header de Turismo */}
      <section className="relative overflow-hidden bg-slate-950 border-b border-slate-800 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1920&auto=format&fit=crop"
            alt="Perú Turismo"
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/70" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 mb-6 tracking-widest uppercase shadow-lg">
            <Icons.Compass className="w-4 h-4 text-amber-400" />
            <span>{t('turismo.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none mb-4">
            {t('turismo.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-sky-400">
              {t('turismo.titleHighlight')}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl mx-auto mb-8">
            {t('turismo.subtitle')}
          </p>

          {/* Caja de Búsqueda y Filtros Principales */}
          <div id="busqueda-avanzada" className="max-w-5xl mx-auto bg-white p-5 sm:p-7 rounded-3xl shadow-2xl border border-slate-200 text-left space-y-4">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Fila 1: Buscador de texto + Botón Avanzado + Botón Buscar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Icons.Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('turismo.searchPlaceholder')}
                    className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-12 pr-10 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                    className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer ${
                      isAdvancedSearchOpen || searchCode
                        ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icons.Sliders className="w-4 h-4 text-amber-600" />
                    <span>{t('turismo.btnAdvanced')}</span>
                  </button>

                  <button
                    type="submit"
                    className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer"
                  >
                    <Icons.Search className="w-4 h-4" />
                    <span>{t('turismo.btnSearch')}</span>
                  </button>
                </div>
              </div>

              {/* Fila 2: Filtros AFUERA visibles directamente */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Departamento / Región */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <label className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Icons.MapPin className="w-3.5 h-3.5 text-sky-600" />
                    {t('turismo.filterRegion')}
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full bg-transparent text-slate-900 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="">{t('turismo.allRegions')}</option>
                    {departments.map((d) => (
                      <option key={d.iddpto} value={d.iddpto}>
                        {d.departamento}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Categoría */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Icons.Layers className="w-3.5 h-3.5 text-emerald-600" />
                    {t('turismo.filterCategory')}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-transparent text-slate-900 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="">{t('turismo.allCategories')}</option>
                    {categories.map((c) => (
                      <option key={c.atrac_categ} value={c.categoria}>
                        {translateMinceturText(c.categoria, language)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Actividad */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Icons.Compass className="w-3.5 h-3.5 text-amber-600" />
                    {t('turismo.filterActivity')}
                  </label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full bg-transparent text-slate-900 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="">{t('turismo.allActivities')}</option>
                    {activities.map((a) => (
                      <option key={a.id || a.codigo} value={a.nombre}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 3: Panel Avanzado (Código de Ficha) */}
              {isAdvancedSearchOpen && (
                <div className="pt-3 border-t border-slate-200 animate-fadeIn">
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                      <label className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1.5 flex items-center gap-2">
                        <Icons.Code className="w-4 h-4 text-amber-600" />
                        <span>{t('turismo.advancedTitle')}</span>
                      </label>
                      <input
                        type="number"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        placeholder={t('turismo.advancedPlaceholder')}
                        className="w-full bg-white text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:border-amber-500 placeholder-slate-400"
                      />
                      <p className="text-[10px] text-amber-700 mt-1">
                        {t('turismo.advancedDesc')}
                      </p>
                    </div>

                    {searchCode && (
                      <button
                        type="button"
                        onClick={() => setSearchCode('')}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 transition-all flex items-center gap-1 self-end sm:self-center"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                        <span>{t('turismo.removeCode')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Botón Reset / Filtros Activos */}
              {(searchTerm || selectedDept || selectedCategory || selectedActivity || searchCode || hasActiveFilters) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {hasActiveFilters ? t('turismo.filtersApplied') : t('turismo.filtersReady')}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                    <span>{t('turismo.clearFilters')}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Contenedor Principal en Blanco */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Sección de Catálogo de Recursos */}
        <section id="listado-atractivos">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5 mb-1">
                <Icons.Compass className="w-4 h-4" />
                {t('turismo.sectionBadge')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {appliedFilters.dept
                  ? `${t('turismo.resourcesIn')} ${departments.find((d) => d.iddpto === appliedFilters.dept)?.departamento || 'Región'}`
                  : appliedFilters.code
                  ? `${t('turismo.codeSearch')} ${appliedFilters.code}`
                  : appliedFilters.search
                  ? `${t('turismo.resultsFor')} "${appliedFilters.search}"`
                  : t('turismo.allResources')}
              </h2>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
                {total.toLocaleString()} {t('turismo.foundCount')}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                  <span>{t('turismo.reset')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Grilla de Recursos */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 tracking-wider">
                {t('turismo.loading')}
              </p>
            </div>
          ) : resources.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.codigo}
                    resource={resource}
                  />
                ))}
              </div>

              {/* Paginación */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={12}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  const el = document.getElementById('listado-atractivos');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 p-8">
              <Icons.Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">{t('turismo.noResults')}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                {t('turismo.noResultsDesc')}
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                <Icons.X className="w-4 h-4" />
                <span>{t('turismo.reset')}</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
