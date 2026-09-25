'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { CustomSelect, SelectOption } from '../../components/CustomSelect';
import { useLanguage } from '../../context/LanguageContext';
import { translateMinceturText, cleanLabel } from '../../utils/minceturTranslate';
import { AdsterraNativeBanner } from '../../components/AdsterraNativeBanner';
import { ResponsiveLeaderboard } from '../../components/AdsterraDisplayBanner';

function TurismoPageContent() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();

  // Datos base de la API
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

  // Sincronizar automáticamente con los parámetros de la URL al cargar o navegar
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const deptParam = searchParams.get('iddpto') || searchParams.get('department') || searchParams.get('dept') || '';
    const catParam = searchParams.get('categoria') || searchParams.get('category') || '';
    const actParam = searchParams.get('actividad') || searchParams.get('activity') || '';
    const codeParam = searchParams.get('codigo') || searchParams.get('code') || '';
    const pageParam = searchParams.get('page');
    const parsedPage = pageParam && !isNaN(Number(pageParam)) ? Math.max(1, Number(pageParam)) : 1;

    if (qParam || deptParam || catParam || actParam || codeParam || parsedPage > 1) {
      setSearchTerm(qParam);
      setSelectedDept(deptParam);
      setSelectedCategory(catParam);
      setSelectedActivity(actParam);
      setSearchCode(codeParam);
      if (codeParam) {
        setIsAdvancedSearchOpen(true);
      }
      setAppliedFilters({
        search: qParam,
        dept: deptParam,
        category: catParam,
        activity: actParam,
        code: codeParam,
      });
      setPage(parsedPage);

      setTimeout(() => {
        const el = document.getElementById('listado-atractivos');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [searchParams]);

  // Reflejar automáticamente en la URL cualquier cambio en filtros aplicados o página
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (appliedFilters.search) params.set('search', appliedFilters.search);
    if (appliedFilters.dept) params.set('department', appliedFilters.dept);
    if (appliedFilters.category) params.set('category', appliedFilters.category);
    if (appliedFilters.activity) params.set('activity', appliedFilters.activity);
    if (appliedFilters.code) params.set('codigo', appliedFilters.code);
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    const targetUrl = qs ? `/turismo?${qs}` : '/turismo';
    window.history.replaceState(null, '', targetUrl);
  }, [appliedFilters, page]);

  // Actualizar el título dinámico según filtros activos
  useEffect(() => {
    const parts: string[] = [];
    if (appliedFilters.search) {
      parts.push(`"${appliedFilters.search}"`);
    }
    if (appliedFilters.dept) {
      const d = departments.find((item) => item.iddpto === appliedFilters.dept);
      if (d) parts.push(cleanLabel(d.departamento));
    }
    if (appliedFilters.category) {
      parts.push(translateMinceturText(appliedFilters.category, language));
    }
    if (appliedFilters.activity) {
      parts.push(cleanLabel(appliedFilters.activity));
    }

    if (parts.length > 0) {
      document.title = `${parts.join(' • ')} | Turismo Perú | OpenData`;
    } else {
      document.title = 'Explorador de Recursos y Atractivos Turísticos | OpenData Perú';
    }
  }, [appliedFilters, departments, language]);

  // Carga inicial de catálogos dinámicos
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

  // Opciones formateadas para CustomSelect
  const departmentOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: `${t('turismo.allRegions')} (${departments.length})`, badge: 'Perú' },
      ...departments.map((d) => ({
        value: d.iddpto,
        label: cleanLabel(d.departamento),
        sublabel: `Ubigeo ${d.iddpto}`,
      })),
    ];
  }, [departments, t]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: `${t('turismo.allCategories')} (${categories.length})`, badge: t('turismo.official') },
      ...categories.map((c) => ({
        value: c.categoria,
        label: translateMinceturText(c.categoria, language),
        sublabel: c.tipos?.length ? `${c.tipos.length} ${t('turismo.typesRegistered')}` : undefined,
      })),
    ];
  }, [categories, language, t]);

  const activityOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: `${t('turismo.allActivities')} (${activities.length})` },
      ...activities.map((a) => ({
        value: a.nombre,
        label: cleanLabel(a.nombre),
      })),
    ];
  }, [activities, t]);

  // Función de consulta de recursos
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

  const handleSelectDept = (val: string) => {
    setSelectedDept(val);
    setAppliedFilters((prev) => ({ ...prev, dept: val }));
    setPage(1);
  };

  const handleSelectCategory = (val: string) => {
    setSelectedCategory(val);
    setAppliedFilters((prev) => ({ ...prev, category: val }));
    setPage(1);
  };

  const handleSelectActivity = (val: string) => {
    setSelectedActivity(val);
    setAppliedFilters((prev) => ({ ...prev, activity: val }));
    setPage(1);
  };

  const removeFilter = (key: keyof typeof appliedFilters) => {
    const updated = { ...appliedFilters, [key]: '' };
    if (key === 'search') setSearchTerm('');
    if (key === 'dept') setSelectedDept('');
    if (key === 'category') setSelectedCategory('');
    if (key === 'activity') setSelectedActivity('');
    if (key === 'code') setSearchCode('');
    setAppliedFilters(updated);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
      appliedFilters.dept ||
      appliedFilters.category ||
      appliedFilters.activity ||
      appliedFilters.code
  );

  const activeDeptName = departments.find((d) => d.iddpto === appliedFilters.dept)?.departamento;

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 min-h-screen pb-24">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER DE TURISMO - ESTILO INSTITUCIONAL */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white">
        {/* Fondo sutil con imagen del Perú */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none opacity-25">
          <img
            src="https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1280&q=70"
            alt="Perú Turismo"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center w-full">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-100">{t('turismo.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {t('turismo.heroTitle')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-sky-500">
              {t('turismo.heroHighlight')}
            </span>
          </h1>

          <p className="mt-3 text-xs sm:text-base text-slate-200 font-normal max-w-2xl mx-auto mb-6 leading-relaxed">
            {t('turismo.heroSubtitle')}
          </p>

          {/* Caja de Búsqueda y Filtros con Soporte Dark/Light Mode */}
          <div
            id="busqueda-avanzada"
            className="max-w-6xl mx-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md text-left space-y-3 transition-colors"
          >
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              {/* Fila 1: Buscador de texto + Botón Avanzado + Botón Buscar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('turismo.searchPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm pl-9 pr-9 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-sans transition-colors"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Icons.X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                    className={`py-2 px-3.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer whitespace-nowrap ${
                      isAdvancedSearchOpen || searchCode
                        ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icons.Sliders className="w-3.5 h-3.5 text-sky-500" />
                    <span>{t('turismo.btnAdvanced')}</span>
                  </button>

                  <button
                    type="submit"
                    className="py-2 sm:py-2.5 px-6 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    <Icons.Search className="w-4 h-4" />
                    <span>{t('turismo.btnSearch')}</span>
                  </button>
                </div>
              </div>

              {/* Fila 2: CustomSelects para Región, Categoría y Actividad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Departamento / Región */}
                <div className="min-w-0">
                  <CustomSelect
                    label=""
                    icon={<Icons.MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />}
                    value={selectedDept}
                    onChange={handleSelectDept}
                    options={departmentOptions}
                    placeholder={t('turismo.allRegions')}
                    searchable
                    variant="default"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:border-sky-500/50 flex items-center justify-between text-xs sm:text-sm transition-colors"
                  />
                </div>

                {/* 2. Categoría */}
                <div className="min-w-0">
                  <CustomSelect
                    label=""
                    icon={<Icons.Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />}
                    value={selectedCategory}
                    onChange={handleSelectCategory}
                    options={categoryOptions}
                    placeholder={t('turismo.allCategories')}
                    searchable
                    variant="default"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:border-sky-500/50 flex items-center justify-between text-xs sm:text-sm transition-colors"
                  />
                </div>

                {/* 3. Actividad */}
                <div className="min-w-0">
                  <CustomSelect
                    label=""
                    icon={<Icons.Compass className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />}
                    value={selectedActivity}
                    onChange={handleSelectActivity}
                    options={activityOptions}
                    placeholder={t('turismo.allActivities')}
                    searchable
                    variant="default"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:border-sky-500/50 flex items-center justify-between text-xs sm:text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Fila 3: Panel Avanzado (Código de Ficha) */}
              {isAdvancedSearchOpen && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                  <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 w-full">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                        <Icons.Code className="w-3.5 h-3.5 text-sky-500" />
                        <span>{t('turismo.advancedTitle')}</span>
                      </label>
                      <input
                        type="number"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        placeholder={t('turismo.advancedPlaceholder')}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500 placeholder-slate-400"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {t('turismo.advancedDesc')}
                      </p>
                    </div>

                    {searchCode && (
                      <button
                        type="button"
                        onClick={() => setSearchCode('')}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 transition-all flex items-center gap-1 self-end sm:self-center cursor-pointer"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                        <span>{t('turismo.removeCode')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Barra de Filtros Activos / Reset */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t('turismo.filtersActive')}
                    </span>
                    {appliedFilters.search && (
                      <button
                        type="button"
                        onClick={() => removeFilter('search')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>{t('turismo.textFilter')}: &quot;{appliedFilters.search}&quot;</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                    {appliedFilters.dept && (
                      <button
                        type="button"
                        onClick={() => removeFilter('dept')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>{t('turismo.deptFilter')}: {activeDeptName || appliedFilters.dept}</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                    {appliedFilters.category && (
                      <button
                        type="button"
                        onClick={() => removeFilter('category')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>{t('turismo.categoryFilter')}: {cleanLabel(appliedFilters.category)}</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                    {appliedFilters.activity && (
                      <button
                        type="button"
                        onClick={() => removeFilter('activity')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>{t('turismo.activityFilter')}: {cleanLabel(appliedFilters.activity)}</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                    {appliedFilters.code && (
                      <button
                        type="button"
                        onClick={() => removeFilter('code')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>{t('turismo.codeFilter')}: #{appliedFilters.code}</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                    <span>{t('turismo.reset')}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATÁLOGO DE RECURSOS - ADAPTABLE DARK / LIGHT MODE */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Banner Display Responsivo (728x90 en desktop, 320x50 en móvil) */}
        <ResponsiveLeaderboard className="mb-8" />

        <section id="listado-atractivos">
          {/* Header de resultados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 mb-8">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mb-1">
                <Icons.Compass className="w-4 h-4" />
                <span>{t('turismo.sectionBadge')}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {appliedFilters.dept
                  ? `${t('turismo.resourcesIn')} ${activeDeptName || 'Región'}`
                  : appliedFilters.code
                  ? `${t('turismo.codeSearch')} #${appliedFilters.code}`
                  : appliedFilters.search
                  ? `${t('turismo.resultsFor')} "${appliedFilters.search}"`
                  : t('turismo.allResources')}
              </h2>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
                {total.toLocaleString()} {t('turismo.foundCount')}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
              <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                {t('turismo.loading')}
              </p>
            </div>
          ) : resources.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {resources.map((resource) => (
                  <ResourceCard key={resource.codigo} resource={resource} />
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

              {/* Anuncio Nativo Adsterra no intrusivo (después de la paginación) */}
              <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-10">
                <AdsterraNativeBanner label="Recomendaciones y Servicios Turísticos" />
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
              <Icons.Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {t('turismo.noResults')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                {t('turismo.noResultsDesc')}
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
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

export default function TurismoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-24">
          <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TurismoPageContent />
    </Suspense>
  );
}
