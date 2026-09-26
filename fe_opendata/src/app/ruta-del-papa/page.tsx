'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiService } from '../../services/api';
import { PapaActivity, PapaCronogramaResponse, PapaDepartment } from '../../types/papa';
import { Icons } from '../../components/Icons';
import { CustomSelect, SelectOption } from '../../components/CustomSelect';
import { useLanguage } from '../../context/LanguageContext';
import { cleanLabel, translateDayOfWeek, translatePapaActivityType } from '../../utils/minceturTranslate';
import { DynamicText } from '../../utils/dynamicTranslate';
import { AdsterraNativeBanner } from '../../components/AdsterraNativeBanner';
import { ResponsiveLeaderboard } from '../../components/AdsterraDisplayBanner';
import { OfficialBadge } from '../../components/OfficialBadge';
import { OfficialSealBadge, TrustVerificationBadge } from '../../components/TrustVerificationBadge';

// Carga dinámica del mapa interactivo con Leaflet
const PapaOpenStreetMap = dynamic(
  () => import('../../components/PapaOpenStreetMap').then((mod) => mod.PapaOpenStreetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[460px] rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Cargando Geoportal interactivo...</span>
      </div>
    ),
  }
);

function RutaPapaPageContent() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();

  // Datos base
  const [data, setData] = useState<PapaCronogramaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados de filtros en formulario (Exclusivamente por Departamento y búsqueda)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    dept: '',
  });

  // Actividad seleccionada para el Inspector del Mapa
  const [selectedMapActivity, setSelectedMapActivity] = useState<PapaActivity | null>(null);

  // Carga inicial de datos
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiService.getPapaCronograma();
        if (isMounted && res) {
          setData(res);
          const firstAct = res.por_departamento[0]?.cronograma[0];
          if (firstAct) {
            setSelectedMapActivity(firstAct);
          }
        }
      } catch (err) {
        console.error('Error cargando cronograma del Papa León XIV:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sincronizar con search params de la URL
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const deptParam = searchParams.get('department') || searchParams.get('dept') || '';

    if (qParam || deptParam) {
      setSearchTerm(qParam);
      setSelectedDept(deptParam);

      setAppliedFilters({
        search: qParam,
        dept: deptParam,
      });
    }
  }, [searchParams]);

  // Actualizar URL al cambiar filtros aplicados
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (appliedFilters.search) params.set('search', appliedFilters.search);
    if (appliedFilters.dept) params.set('department', appliedFilters.dept);

    const qs = params.toString();
    const targetUrl = qs ? `/ruta-del-papa?${qs}` : '/ruta-del-papa';
    window.history.replaceState(null, '', targetUrl);
  }, [appliedFilters]);

  // Departamentos disponibles
  const departments: PapaDepartment[] = useMemo(() => {
    return data?.por_departamento || [];
  }, [data]);

  // Todas las actividades
  const allActivities: PapaActivity[] = useMemo(() => {
    if (!data?.por_departamento) return [];
    return data.por_departamento.flatMap((d) => d.cronograma);
  }, [data]);

  // Opciones para CustomSelect de Departamentos
  const departmentOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: t('papa.allDepts'), badge: 'Perú' },
      ...departments.map((d) => ({
        value: d.slug,
        label: cleanLabel(d.departamento),
        sublabel: `${d.cronograma.length} actividades oficiales`,
      })),
    ];
  }, [departments, t]);

  // Lista de actividades filtradas
  const filteredActivities = useMemo(() => {
    let list = allActivities;

    if (appliedFilters.dept) {
      const deptSlug = appliedFilters.dept.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.departamento.toLowerCase() === deptSlug ||
          a.departamento.toLowerCase().replace(/\s+/g, '-') === deptSlug ||
          departments.find((d) => d.slug === deptSlug)?.cronograma.some((x) => x.id === a.id)
      );
    }

    if (appliedFilters.search.trim()) {
      const q = appliedFilters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          a.lugar.toLowerCase().includes(q) ||
          a.descripcion.toLowerCase().includes(q) ||
          a.departamento.toLowerCase().includes(q) ||
          a.provincia.toLowerCase().includes(q) ||
          a.distrito.toLowerCase().includes(q) ||
          a.dia_semana.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allActivities, departments, appliedFilters]);

  // Agrupar actividades por fecha de forma cronológica
  const groupedActivitiesByDate = useMemo(() => {
    const groups: { [date: string]: { date: string; dia_semana: string; items: PapaActivity[] } } = {};

    filteredActivities.forEach((act) => {
      if (!groups[act.fecha]) {
        groups[act.fecha] = {
          date: act.fecha,
          dia_semana: act.dia_semana,
          items: [],
        };
      }
      groups[act.fecha].items.push(act);
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredActivities]);

  // Sincronizar actividad seleccionada cuando cambia la lista filtrada
  useEffect(() => {
    if (filteredActivities.length > 0) {
      const stillExists = filteredActivities.some((a) => a.id === selectedMapActivity?.id);
      if (!stillExists) {
        setSelectedMapActivity(filteredActivities[0]);
      }
    } else {
      setSelectedMapActivity(null);
    }
  }, [filteredActivities, selectedMapActivity]);

  // Manejo de formulario de búsqueda
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      search: searchTerm,
      dept: selectedDept,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setAppliedFilters({
      search: '',
      dept: '',
    });
  };

  const removeFilter = (key: keyof typeof appliedFilters) => {
    const updated = { ...appliedFilters, [key]: '' };
    if (key === 'search') setSearchTerm('');
    if (key === 'dept') setSelectedDept('');
    setAppliedFilters(updated);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search || appliedFilters.dept
  );

  const activeDeptName = departments.find((d) => d.slug === appliedFilters.dept)?.departamento;

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 min-h-screen pb-24 w-full overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER DE LA RUTA PAPAL - ESTILO INSTITUCIONAL TURISMO */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-16 px-3.5 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white overflow-hidden w-full">
        {/* Fondo sutil con imagen del Perú */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none opacity-25">
          <img
            src="https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1280&q=70"
            alt="Perú Papa León XIV"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Columna Izquierda: Textos, Títulos y Buscador */}
            <div className="lg:col-span-8 text-left space-y-4 min-w-0">
              {/* Sello institucional oficial */}
              <div className="flex items-center">
                <OfficialSealBadge source="IRTP • Presidencia de la República • Santa Sede" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words">
                {t('papa.title')}{' '}
                <span className="text-white">
                  {t('papa.titleHighlight')}
                </span>
              </h1>

              <p className="text-xs sm:text-base text-slate-200 font-normal max-w-2xl leading-relaxed">
                {t('papa.subtitle')}
              </p>

          {/* Caja de Búsqueda y Filtro por Departamento */}
          <div
            id="busqueda-avanzada"
            className="max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 sm:p-5 shadow-xs backdrop-blur-md text-left space-y-3 transition-colors w-full"
          >
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              {/* Buscador de texto + Selector de Departamento + Botón Buscar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-6 relative">
                  <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('papa.searchPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm pl-9 pr-9 py-2 rounded-md border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] font-sans transition-colors"
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

                <div className="sm:col-span-4 min-w-0">
                  <CustomSelect
                    label=""
                    icon={<Icons.MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                    value={selectedDept}
                    onChange={(val) => {
                      setSelectedDept(val);
                      setAppliedFilters((prev) => ({ ...prev, dept: val }));
                    }}
                    options={departmentOptions}
                    placeholder={t('papa.filterDept')}
                    searchable
                    variant="default"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-600 flex items-center justify-between text-xs sm:text-sm transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 sm:py-2.5 px-4 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Icons.Search className="w-4 h-4" />
                    <span>{t('turismo.btnSearch')}</span>
                  </button>
                </div>
              </div>

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
                        className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 transition-colors"
                      >
                        <span>{t('turismo.textFilter')}: &quot;{appliedFilters.search}&quot;</span>
                        <Icons.X className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                    {appliedFilters.dept && (
                      <button
                        type="button"
                        onClick={() => removeFilter('dept')}
                        className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 transition-colors"
                      >
                        <span>{t('turismo.deptFilter')}: {activeDeptName || appliedFilters.dept}</span>
                        <Icons.X className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                    <span>{t('turismo.reset')}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Columna Derecha: Retrato Oficial del Papa León XIV sin fondo */}
        <div className="lg:col-span-4 flex items-end justify-center relative pt-4 lg:pt-0 self-end -mb-16 pointer-events-none">
          {/* Resplandor áureo posterior */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/25 via-amber-400/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="relative pointer-events-auto max-w-full">
            <img
              src="https://www.vatican.va/etc/designs/vatican/library/clientlibs/themes/vatican-v2/images/leo-xiv.png"
              alt="Papa León XIV"
              loading="eager"
              decoding="async"
              className="h-72 sm:h-96 lg:h-[460px] xl:h-[500px] w-auto max-w-full object-contain object-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] select-none block"
            />
          </div>
        </div>
      </div>
    </div>
  </section>

      {/* ========================================================================= */}
      {/* 2. GEOPORTAL DE LA RUTA PAPAL: OPENSTREETMAP + INSPECTOR TÉCNICO */}
      {/* ========================================================================= */}
      <section id="mapa-papa" className="py-16 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0B3B60] dark:text-slate-300 uppercase tracking-wider mb-1.5">
              <Icons.Navigation className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
              <span>{t('papa.geoportalBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('papa.geoportalTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('papa.geoportalDesc')}
            </p>
          </div>

          {/* Selector de Departamento al costado del mapa (Igual que en Geoportal) */}
          <div className="w-full sm:w-64">
            <CustomSelect
              label=""
              icon={<Icons.MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
              value={selectedDept}
              onChange={(val) => {
                setSelectedDept(val);
                setAppliedFilters((prev) => ({ ...prev, dept: val }));
              }}
              options={departmentOptions}
              placeholder={t('papa.filterDept')}
              searchable
              variant="default"
              buttonClassName="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-600 flex items-center justify-between text-xs sm:text-sm shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Layout del Mapa: Geoportal Interactivo + Listado de Actividades del Departamento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Geoportal Interactivo con Leaflet */}
          <div className="lg:col-span-7 flex flex-col min-h-[460px] sm:min-h-[520px] rounded-lg overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800">
            <PapaOpenStreetMap
              activities={filteredActivities}
              selectedActivity={selectedMapActivity}
              onSelectActivity={(act) => setSelectedMapActivity(act)}
              selectedDepartmentSlug={appliedFilters.dept}
            />
          </div>

          {/* Panel Lateral: Listado completo de Actividades del Departamento / Filtro */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 h-full flex flex-col justify-between shadow-xs transition-colors">
              {/* Encabezado del panel lateral */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Icons.Calendar className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                    <span>
                      {appliedFilters.dept
                        ? t('papa.deptActivities').replace('{dept}', activeDeptName || selectedDept)
                        : t('papa.allDeptActivities')}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('papa.selectToLocate')}
                  </p>
                </div>

                <OfficialBadge variant="papa">
                  {filteredActivities.length} {t('papa.activitiesFound')}
                </OfficialBadge>
              </div>

              {/* Lista con scroll de todas las actividades del departamento */}
              <div className="flex-1 max-h-[460px] sm:max-h-[500px] overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((act) => {
                    const isSelected = selectedMapActivity?.id === act.id;

                    return (
                      <div
                        key={act.id}
                        onClick={() => setSelectedMapActivity(act)}
                        className={`p-3.5 rounded-lg border transition-all duration-200 cursor-pointer text-left ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 border-[#0B3B60] ring-1 ring-[#0B3B60] shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Fila 1: Hora, Fecha y Tipo */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <OfficialBadge variant="papa">
                              {act.hora} hrs
                            </OfficialBadge>
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Icons.Calendar className="w-3 h-3 text-slate-400" />
                              <span>{translateDayOfWeek(act.dia_semana, language)} {act.fecha.slice(8, 10)} {t('papa.november')}</span>
                            </span>
                          </div>

                          <OfficialBadge variant="code">
                            {translatePapaActivityType(act.tipo, language)}
                          </OfficialBadge>
                        </div>

                        {/* Título de la actividad */}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2">
                          <DynamicText text={act.titulo} />
                        </h4>

                        {/* Lugar y Ubicación */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <Icons.Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold truncate">
                              <DynamicText text={act.lugar} />
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <Icons.MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {act.distrito ? `${cleanLabel(act.distrito)}, ` : ''}{cleanLabel(act.provincia)} • <strong className="text-slate-800 dark:text-slate-200">{cleanLabel(act.departamento)}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Señal de verificación oficial */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <TrustVerificationBadge source="IRTP" date="14/11/2026" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="my-auto text-center py-12 space-y-3">
                    <Icons.Compass className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {t('turismo.noResults')}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      {t('turismo.noResultsDesc')}
                    </p>
                  </div>
                )}
              </div>

              {/* Botón de enlace oficial en el pie del panel */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <a
                  href="https://www.gob.pe/institucion/irtp/noticias/1446972-papa-leon-xiv-en-peru-conoce-el-programa-oficial-de-actividades-del-santo-padre-durante-su-visita-a-nuestro-pais"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-xs text-[#0B3B60] dark:text-slate-300 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{t('papa.readOfficial')}</span>
                  <Icons.ExternalLink className="w-3.5 h-3.5" />
                </a>

                <span className="text-[10px] font-mono text-slate-400">
                  {selectedMapActivity ? `#${selectedMapActivity.id}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ITINERARIO COMPLETO: CATÁLOGO DE ACTIVIDADES (ESTILO TURISMO) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 mt-6 w-full overflow-hidden">
        {/* Banner Display Responsivo (728x90 en desktop, 320x50 en móvil) */}
        <ResponsiveLeaderboard className="mb-8" />

        <section id="listado-actividades">
          {/* Header de resultados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 mb-8">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                <Icons.Compass className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                <span>{t('turismo.sectionBadge')}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {appliedFilters.dept
                  ? `${t('turismo.resourcesIn')} ${activeDeptName || 'Región'}`
                  : appliedFilters.search
                  ? `${t('turismo.resultsFor')} "${appliedFilters.search}"`
                  : t('papa.itineraryTitle')}
              </h2>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
                {filteredActivities.length} {t('papa.activitiesFound')}
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

          {/* Listado de Actividades Agrupadas por Fecha */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                {t('turismo.loading')}
              </p>
            </div>
          ) : groupedActivitiesByDate.length > 0 ? (
            <div className="space-y-10">
              {groupedActivitiesByDate.map((group) => {
                const dayNum = group.date.slice(8, 10);
                return (
                  <div key={group.date} className="space-y-4">
                    {/* 1. Fecha primero con título destacado */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-[#0B3B60] dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                          <Icons.Calendar className="w-5 h-5 text-[#0B3B60] dark:text-slate-300" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {translateDayOfWeek(group.dia_semana, language)} {dayNum} {t('papa.november')}
                          </h3>
                        </div>
                      </div>

                      <OfficialBadge variant="code">
                        {group.items.length} {group.items.length === 1 ? t('papa.officialActivity') : t('papa.officialActivities')}
                      </OfficialBadge>
                    </div>

                    {/* 2. Línea divisoria */}
                    <div className="h-px w-full bg-slate-200 dark:border-slate-800" />

                    {/* 3. Lista de actividades (Formato Institucional) */}
                    <div className="divide-y divide-slate-200/80 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                      {group.items.map((activity) => {
                        const isSelected = selectedMapActivity?.id === activity.id;

                        return (
                          <div
                            key={activity.id}
                            onClick={() => {
                              setSelectedMapActivity(activity);
                              const mapEl = document.getElementById('mapa-papa');
                              if (mapEl) {
                                mapEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className={`p-4 sm:p-5 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-100/90 dark:bg-slate-800/60'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Columna 1: Hora y Tipo */}
                            <div className="flex items-center lg:flex-col lg:items-start gap-2 shrink-0 lg:w-36">
                              <OfficialBadge variant="papa">
                                {activity.hora} hrs
                              </OfficialBadge>
                              <OfficialBadge variant="code">
                                {translatePapaActivityType(activity.tipo, language)}
                              </OfficialBadge>
                            </div>

                            {/* Columna 2: Título, Lugar, Ubicación, Descripción y Verificación */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                                <DynamicText text={activity.titulo} />
                              </h4>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                  <Icons.Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    <DynamicText text={activity.lugar} />
                                  </span>
                                </span>

                                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                  <Icons.MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    {activity.distrito ? `${cleanLabel(activity.distrito)}, ` : ''}{cleanLabel(activity.provincia)} • <strong className="text-slate-800 dark:text-slate-200">{cleanLabel(activity.departamento)}</strong>
                                  </span>
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                                <DynamicText text={activity.descripcion} />
                              </p>

                              {/* Señal de verificación oficial de fuente */}
                              <div className="pt-2">
                                <TrustVerificationBadge source="IRTP / Santa Sede" date="14/11/2026" />
                              </div>
                            </div>

                            {/* Columna 3: Botón de Ubicar en Mapa */}
                            <div className="shrink-0 self-end lg:self-center">
                              <button
                                type="button"
                                className={`text-xs font-semibold px-3.5 py-2 rounded-md border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0B3B60] text-white border-[#0B3B60] shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0B3B60] hover:text-[#0B3B60]'
                                }`}
                              >
                                <Icons.MapPin className="w-3.5 h-3.5" />
                                <span>{isSelected ? t('papa.locatedOnMap') : t('papa.viewOnMap')}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-xs">
              <Icons.Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {t('turismo.noResults')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                {t('turismo.noResultsDesc')}
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Icons.X className="w-4 h-4" />
                <span>{t('turismo.reset')}</span>
              </button>
            </div>
          )}

          {/* Anuncio Nativo Adsterra Estratégico */}
          <AdsterraNativeBanner />
        </section>
      </div>
    </main>
  );
}

export default function RutaPapaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-24">
          <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RutaPapaPageContent />
    </Suspense>
  );
}
