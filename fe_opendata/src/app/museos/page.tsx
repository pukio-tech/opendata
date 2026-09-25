'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { museosApi } from '../../services/museosApi';
import { MuseoCategory, MuseoDepartment, MuseoItem, MuseoStats } from '../../types/museo';
import { MuseoCard } from '../../components/MuseoCard';
import { Pagination } from '../../components/Pagination';
import { Icons } from '../../components/Icons';
import { CustomSelect, SelectOption } from '../../components/CustomSelect';
import { useLanguage } from '../../context/LanguageContext';
import { ResponsiveLeaderboard } from '../../components/AdsterraDisplayBanner';
import { AdsterraNativeBanner } from '../../components/AdsterraNativeBanner';

function MuseosPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  // Estados de datos de soporte
  const [departments, setDepartments] = useState<MuseoDepartment[]>([]);
  const [categories, setCategories] = useState<MuseoCategory[]>([]);
  const [stats, setStats] = useState<MuseoStats | null>(null);

  // Estados de Filtros en Formulario
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyVirtualTour, setOnlyVirtualTour] = useState<boolean>(false);

  // Filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    dept: '',
    category: '',
    virtualTour: false,
  });

  // Estados de Listado y Paginación
  const [museos, setMuseos] = useState<MuseoItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar datos de soporte iniciales
  useEffect(() => {
    Promise.all([
      museosApi.getDepartments(),
      museosApi.getCategories(),
      museosApi.getStats(),
    ]).then(([deps, cats, st]) => {
      setDepartments(deps);
      setCategories(cats);
      setStats(st);
    });
  }, []);

  // Sincronizar filtros con la URL al cargar o navegar
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const deptParam = searchParams.get('department') || searchParams.get('dept') || '';
    const catParam = searchParams.get('category') || '';
    const vtParam = searchParams.get('virtual') === 'true';
    const pageParam = searchParams.get('page');
    const parsedPage = pageParam && !isNaN(Number(pageParam)) ? Math.max(1, Number(pageParam)) : 1;

    setSearchTerm(qParam);
    setSelectedDept(deptParam);
    setSelectedCategory(catParam);
    setOnlyVirtualTour(vtParam);
    setAppliedFilters({
      search: qParam,
      dept: deptParam,
      category: catParam,
      virtualTour: vtParam,
    });
    setPage(parsedPage);

    if (qParam || deptParam || catParam || vtParam || parsedPage > 1) {
      setTimeout(() => {
        const el = document.getElementById('listado-museos');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [searchParams]);

  // Ejecutar consulta a la API
  const fetchMuseos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await museosApi.searchMuseos({
        search: appliedFilters.search,
        department: appliedFilters.dept,
        category: appliedFilters.category,
        hasVirtualTour: appliedFilters.virtualTour,
        page,
        limit: 12,
      });
      setMuseos(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error cargando museos:', err);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    fetchMuseos();
  }, [fetchMuseos]);

  // Manejadores de Formulario
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      search: searchTerm,
      dept: selectedDept,
      category: selectedCategory,
      virtualTour: onlyVirtualTour,
    });
    setPage(1);
    const el = document.getElementById('listado-museos');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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

  const removeFilter = (key: keyof typeof appliedFilters) => {
    const updated = { ...appliedFilters, [key]: key === 'virtualTour' ? false : '' };
    if (key === 'search') setSearchTerm('');
    if (key === 'dept') setSelectedDept('');
    if (key === 'category') setSelectedCategory('');
    if (key === 'virtualTour') setOnlyVirtualTour(false);
    setAppliedFilters(updated);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedCategory('');
    setOnlyVirtualTour(false);
    setAppliedFilters({
      search: '',
      dept: '',
      category: '',
      virtualTour: false,
    });
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
      appliedFilters.dept ||
      appliedFilters.category ||
      appliedFilters.virtualTour
  );

  const activeDeptName = departments.find((d) => d.departamento === appliedFilters.dept)?.departamento;

  const departmentOptions: SelectOption[] = [
    { value: '', label: 'Todos los Departamentos' },
    ...departments.map((d) => ({
      value: d.departamento,
      label: `${d.departamento} (${d.count})`,
    })),
  ];

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Todas las Categorías' },
    ...categories.map((c) => ({
      value: c.categoria,
      label: `${c.categoria} (${c.count})`,
    })),
  ];

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 min-h-screen pb-24">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER DE MUSEOS - ESTILO INSTITUCIONAL IGUAL QUE EN TURISMO */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white">
        {/* Fondo sutil */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none opacity-20">
          <img
            src="https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=1280&q=70"
            alt="Museos del Perú"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center w-full">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <Icons.Building className="w-3.5 h-3.5" />
              <span>Directorio Oficial de Museos del Perú</span>
            </span>

            {stats && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Icons.Eye className="w-3.5 h-3.5" />
                <span>{stats.total_virtuales} con Recorrido 360°</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Museos del{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-sky-500">
              Perú
            </span>
          </h1>

          <p className="mt-3 text-xs sm:text-base text-slate-200 font-normal max-w-2xl mx-auto mb-6 leading-relaxed">
            Explora la red nacional de museos del Ministerio de Cultura y museos públicos y privados. Consulta colecciones, horarios oficiales, tarifas y recorridos virtuales interactivos.
          </p>

          {/* Caja de Búsqueda y Filtros con Soporte Dark/Light Mode */}
          <div
            id="busqueda-avanzada"
            className="max-w-6xl mx-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md text-left space-y-3 transition-colors"
          >
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              {/* Fila 1: Buscador de texto + Botón Buscar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar museo por nombre, distrito o palabra clave..."
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
                    onClick={() => {
                      const nextVal = !onlyVirtualTour;
                      setOnlyVirtualTour(nextVal);
                      setAppliedFilters((prev) => ({ ...prev, virtualTour: nextVal }));
                    }}
                    className={`py-2 px-3.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer whitespace-nowrap ${
                      onlyVirtualTour
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icons.Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>Recorrido 360°</span>
                  </button>

                  <button
                    type="submit"
                    className="py-2 sm:py-2.5 px-6 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    <Icons.Search className="w-4 h-4" />
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              {/* Fila 2: CustomSelects para Departamento y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Departamento */}
                <div className="min-w-0">
                  <CustomSelect
                    label=""
                    icon={<Icons.MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />}
                    value={selectedDept}
                    onChange={handleSelectDept}
                    options={departmentOptions}
                    placeholder="Todos los Departamentos"
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
                    placeholder="Todas las Categorías"
                    searchable
                    variant="default"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:border-sky-500/50 flex items-center justify-between text-xs sm:text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Barra de Filtros Activos / Reset */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Filtros activos:
                    </span>
                    {appliedFilters.search && (
                      <button
                        type="button"
                        onClick={() => removeFilter('search')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>Búsqueda: &quot;{appliedFilters.search}&quot;</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                    {appliedFilters.dept && (
                      <button
                        type="button"
                        onClick={() => removeFilter('dept')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>Región: {activeDeptName || appliedFilters.dept}</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                    {appliedFilters.category && (
                      <button
                        type="button"
                        onClick={() => removeFilter('category')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>Categoría: {appliedFilters.category}</span>
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                    {appliedFilters.virtualTour && (
                      <button
                        type="button"
                        onClick={() => removeFilter('virtualTour')}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-colors"
                      >
                        <span>Recorrido 360°</span>
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
                    <span>Restablecer</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATÁLOGO DE MUSEOS - GRID DE 4 COLUMNAS CON ANUNCIOS IGUAL QUE TURISMO */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Banner Display Responsivo (728x90 en desktop, 320x50 en móvil) */}
        <ResponsiveLeaderboard className="mb-8" />

        <section id="listado-museos">
          {/* Header de resultados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 mb-8">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mb-1">
                <Icons.Building className="w-4 h-4" />
                <span>Inventario Nacional de Museos</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {appliedFilters.dept
                  ? `Museos en ${activeDeptName || appliedFilters.dept}`
                  : appliedFilters.search
                  ? `Resultados para "${appliedFilters.search}"`
                  : 'Todos los Museos'}
              </h2>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
                {total.toLocaleString()} museos encontrados
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              )}
            </div>
          </div>

          {/* Grilla de Museos */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                Cargando directorio de museos...
              </p>
            </div>
          ) : museos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {museos.map((m) => (
                  <MuseoCard key={m.id_museo} museo={m} />
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
                  const el = document.getElementById('listado-museos');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Anuncio Nativo Adsterra no intrusivo (después de la paginación) */}
              <AdsterraNativeBanner className="mt-8" />
            </>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
              <Icons.Building className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                No se encontraron museos con los filtros seleccionados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Prueba cambiando el departamento, buscando otra palabra clave o quitando el filtro de recorrido virtual.
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <Icons.X className="w-4 h-4" />
                <span>Restablecer Filtros</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function MuseosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-24">
          <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MuseosPageContent />
    </Suspense>
  );
}
