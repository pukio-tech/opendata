'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Icons } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { CustomSelect, SelectOption } from '../components/CustomSelect';
import { apiService, getPhotoUrl } from '../services/api';
import { DepartmentItem, CategoryItem, ActivityItem, ResourceItem } from '../types/mincetur';
import { createResourceSlug } from '../utils/slug';

const OpenStreetMap = dynamic(
  () => import('../components/OpenStreetMap').then((mod) => mod.OpenStreetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[460px] sm:min-h-[520px] rounded-3xl bg-slate-900 animate-pulse flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs border border-slate-800">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>Cargando Geoportal OpenStreetMap...</span>
      </div>
    ),
  }
);

function cleanLabel(text: string | null | undefined): string {
  if (!text) return '';
  let cleaned = text
    .replace(/^[0-9a-zA-Z]{1,3}[\.\)\-]\s*/, '')
    .replace(/^[\.\-\/\s]+/, '')
    .trim();

  if (!cleaned) cleaned = text.trim();

  const prepositions = ['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'e', 'o', 'u', 'por', 'con', 'al'];
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Rango geográfico del Perú para proyectar coordenadas GPS (WGS84) al mapa
const GEO_BOUNDS = {
  minX: -81.33, // Longitud Oeste (Piura / Tumbes)
  maxX: -68.65, // Longitud Este (Madre de Dios / Puno)
  minY: -18.35, // Latitud Sur (Tacna)
  maxY: -0.04,  // Latitud Norte (Loreto)
};

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();

  // Datos dinámicos cargados 100% desde la API
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [featuredResources, setFeaturedResources] = useState<ResourceItem[]>([]);
  const [mapResources, setMapResources] = useState<ResourceItem[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState<boolean>(true);
  const [loadingMap, setLoadingMap] = useState<boolean>(true);

  // Totales cuantitativos en tiempo real de la API
  const [totalResourcesCount, setTotalResourcesCount] = useState<number>(0);
  const [naturalCount, setNaturalCount] = useState<number>(0);
  const [culturalCount, setCulturalCount] = useState<number>(0);
  const [folkloreCount, setFolkloreCount] = useState<number>(0);

  // Estado del selector de departamento en el mapa interactivo
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Slider de fondos del Hero
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isSliderPaused, setIsSliderPaused] = useState<boolean>(false);

  // Recurso seleccionado para el mapa
  const [selectedMapResource, setSelectedMapResource] = useState<ResourceItem | null>(null);

  // =========================================================================
  // 1. CARGA DINÁMICA DE METADATA (DEPARTAMENTOS, CATEGORÍAS, ACTIVIDADES)
  // =========================================================================
  useEffect(() => {
    // Departamentos
    apiService.getDepartments().then((data) => {
      setDepartments(data || []);
    });

    // Categorías
    apiService.getCategories().then((data) => {
      setCategories(data || []);
    });

    // Actividades
    apiService.getActivities().then((data) => {
      setActivities(data || []);
    });

    // Conteo total general
    apiService.searchResources({ limit: 1 }).then((res) => {
      setTotalResourcesCount(res.total || 0);
    });

    // Conteo categoría 1: Sitios Naturales
    apiService.searchResources({ category: '1', limit: 1 }).then((res) => {
      setNaturalCount(res.total || 0);
    });

    // Conteo categoría 2: Manifestaciones Culturales
    apiService.searchResources({ category: '2', limit: 1 }).then((res) => {
      setCulturalCount(res.total || 0);
    });

    // Conteo categoría 3: Folclore
    apiService.searchResources({ category: '3', limit: 1 }).then((res) => {
      setFolkloreCount(res.total || 0);
    });
  }, []);

  // =========================================================================
  // 2. CARGA DINÁMICA DE DESTINOS DESTACADOS DESDE LA API (RANDOM 6)
  // =========================================================================
  useEffect(() => {
    setLoadingFeatured(true);
    apiService
      .getFeaturedResources({
        limit: 6,
      })
      .then((items) => {
        setFeaturedResources(items || []);
      })
      .finally(() => {
        setLoadingFeatured(false);
      });
  }, []);

  // =========================================================================
  // 3. CARGA DINÁMICA DE PUNTOS GEORREFERENCIADOS PARA OPENSTREETMAP
  // =========================================================================
  useEffect(() => {
    setLoadingMap(true);
    apiService
      .getMapResources({
        department: selectedDept || undefined,
        limit: 200,
      })
      .then((items) => {
        const withCoords = (items || []).filter(
          (r) => (r.coordenadas?.latitud ?? r.y) != null && (r.coordenadas?.longitud ?? r.x) != null
        );
        setMapResources(withCoords);
        if (withCoords.length > 0) {
          setSelectedMapResource(withCoords[0]);
        }
      })
      .finally(() => {
        setLoadingMap(false);
      });
  }, [selectedDept]);

  // Opciones de Departamentos para el Mapa interactivo
  const departmentOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: `Todas las regiones (${departments.length})`, badge: 'Perú' },
      ...departments.map((d) => ({
        value: d.iddpto,
        label: cleanLabel(d.departamento),
        sublabel: `Ubigeo ${d.iddpto}`,
      })),
    ];
  }, [departments]);

  // Rotación suave del slider del Hero cada 6 segundos
  useEffect(() => {
    if (isSliderPaused || featuredResources.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % Math.min(featuredResources.length, 5));
    }, 6000);
    return () => clearInterval(interval);
  }, [isSliderPaused, featuredResources]);

  // Recurso activo del Hero Slider
  const activeHeroItem = featuredResources[currentSlideIndex] || featuredResources[0];

  return (
    <main className="flex-1 text-slate-900 dark:text-white transition-colors duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION DINÁMICA CON DATOS DE LA API & FILTROS GLASSMORPHISM */}
      {/* ========================================================================= */}
      <section
        className="relative min-h-[90vh] sm:min-h-[94vh] flex flex-col justify-between pt-10 pb-28 sm:pb-36 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950"
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
      >
        {/* Fondo Dinámico con Fotos Oficiales de la API */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          {featuredResources.slice(0, 5).map((resource, idx) => {
            const isActive = idx === currentSlideIndex;
            const photoUrl = resource.imagen || resource.foto_url || getPhotoUrl(resource.codigo);
            return (
              <div
                key={resource.codigo}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                }`}
              >
                <img
                  src={photoUrl}
                  alt={resource.nombre}
                  onError={(e) => {
                    // Fallback visual en caso de que la foto oficial no esté cargada
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1920&auto=format&fit=crop';
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/40 backdrop-blur-[0.5px]" />
                <div className="absolute inset-0 bg-slate-950/40" />
              </div>
            );
          })}
        </div>

        {/* Top Tag & Estado de Sincronización en Tiempo Real */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between">

          {activeHeroItem && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/10 text-xs text-slate-300">
              <Icons.MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-white">{cleanLabel(activeHeroItem.nombre)}</span>
              <span className="text-[11px] text-amber-400 font-bold">({cleanLabel(activeHeroItem.desdpto)})</span>
            </div>
          )}
        </div>

        {/* Titular Principal de Alto Impacto */}
        <div className="relative z-10 max-w-5xl mx-auto text-center my-auto py-8">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white uppercase leading-[1.05] drop-shadow-2xl">
            Descubre los Recursos <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
              Turísticos del Perú
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-lg md:text-xl text-slate-200 font-normal max-w-3xl mx-auto leading-relaxed drop-shadow">
            Explora de manera abierta más de{' '}
            <span className="font-bold text-amber-300">
              {totalResourcesCount > 0 ? totalResourcesCount.toLocaleString() : '2,291'}
            </span>{' '}
            atractivos georreferenciados, rutas y patrimonio oficial sincronizados en tiempo real con el portal nacional de MINCETUR.
          </p>

          {/* Botones de Acción y Exploración */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/turismo"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/25 hover:scale-[1.03] active:scale-95 transition-all duration-200"
            >
              <Icons.Compass className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              <span>Explorar Catálogo Turístico</span>
            </Link>
            <Link
              href="/#mapa-preview"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 font-bold text-xs sm:text-sm hover:scale-[1.03] active:scale-95 transition-all duration-200 backdrop-blur-md shadow-xl"
            >
              <Icons.MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              <span>Ver Mapa Interactivo</span>
            </Link>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. GALERÍA DE DESTINOS DINÁMICA CON LA API & MODAL TÉCNICO OFICIAL */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Icons.Compass className="w-3.5 h-3.5" />
              <span>Catálogo Abierto</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Recursos Turísticos Destacados
            </h2>
          </div>
        </div>

        {/* Grid de Destinos Reales */}
        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-80 rounded-3xl glass-card animate-pulse flex flex-col justify-between p-6"
              >
                <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredResources.map((item) => {
              const photo = item.imagen || item.foto_url || getPhotoUrl(item.codigo);
              const slug = createResourceSlug(item.nombre, item.codigo);

              return (
                <div
                  key={item.codigo}
                  className="rounded-3xl glass-card overflow-hidden group flex flex-col justify-between hover:shadow-2xl transition-all duration-300"
                >
                  {/* Foto Oficial con Link directo al detalle */}
                  <Link
                    href={`/turismo/${slug}`}
                    className="relative h-56 w-full overflow-hidden bg-slate-900 block cursor-pointer"
                  >
                    <img
                      src={photo}
                      alt={item.nombre}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=600&auto=format&fit=crop';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md border border-white/20">
                        {cleanLabel(item.desdpto || 'Perú')}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-950/80 text-amber-300 border border-white/20">
                        Ficha #{item.codigo}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-400/90 text-slate-950 truncate max-w-[180px]">
                        {cleanLabel(item.categoria)}
                      </span>
                    </div>
                  </Link>

                  {/* Cuerpo de la Card */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {cleanLabel(item.tipo_categoria || item.desprov || 'Ubicación Verificada')}
                      </span>
                      <Link href={`/turismo/${slug}`}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors line-clamp-1 cursor-pointer">
                          {cleanLabel(item.nombre)}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {item.subtipo_categoria
                          ? cleanLabel(item.subtipo_categoria)
                          : `Recurso turístico oficial inventariado en la provincia de ${cleanLabel(item.desprov)} (${cleanLabel(item.desdpto)}).`}
                      </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <Link
                        href={`/turismo/${slug}`}
                        className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-1.5 transition-colors cursor-pointer group-hover:translate-x-0.5"
                      >
                        <span>Ver Ficha</span>
                        <Icons.ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href={`/turismo/${slug}`}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white transition-all text-slate-600 dark:text-slate-300"
                        title="Ver detalle completo"
                      >
                        <Icons.ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. MAPA INTERACTIVO DINÁMICO CON COORDENADAS WGS84 DE LA API */}
      {/* ========================================================================= */}
      <section id="mapa-preview" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Icons.Navigation className="w-3.5 h-3.5" />
              <span>Geoportal de Turismo Nacional</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Mapa Interactivo de Atractivos
            </h2>
          </div>

          {/* Selector de Departamento para el Mapa */}
          <div className="w-full sm:w-64">
            <CustomSelect
              label="Filtrar por Región"
              icon={<Icons.MapPin className="w-3.5 h-3.5 text-amber-400" />}
              value={selectedDept}
              onChange={setSelectedDept}
              options={departmentOptions}
              placeholder="Todas las regiones..."
              searchable
              variant="default"
            />
          </div>
        </div>

        {/* Layout del Mapa: OpenStreetMap + Inspector Activo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Geoportal OpenStreetMap con Leaflet */}
          <div className="lg:col-span-7 flex flex-col min-h-[460px] sm:min-h-[520px]">
            <OpenStreetMap
              resources={mapResources}
              selectedResource={selectedMapResource}
              onSelectResource={setSelectedMapResource}
            />
          </div>

          {/* Inspector del Recurso Seleccionado */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl h-full flex flex-col justify-between transition-all">
              {selectedMapResource ? (
                <div>
                  {/* Foto del recurso activo en el mapa */}
                  <div className="relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden mb-5 bg-slate-900">
                    <img
                      src={selectedMapResource.imagen || selectedMapResource.foto_url || getPhotoUrl(selectedMapResource.codigo)}
                      alt={selectedMapResource.nombre}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=600&auto=format&fit=crop';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/20">
                        {cleanLabel(selectedMapResource.desdpto)}
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-amber-500/90 text-slate-950">
                        Ficha #{selectedMapResource.codigo}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {cleanLabel(selectedMapResource.nombre)}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {selectedMapResource.tipo_categoria
                      ? `${cleanLabel(selectedMapResource.tipo_categoria)} registrado en la provincia de ${cleanLabel(selectedMapResource.desprov)}.`
                      : `Atractivo inventariado oficialmente en la región de ${cleanLabel(selectedMapResource.desdpto)}.`}
                  </p>

                  {/* Cuadrícula de Datos Técnicos */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Categoría
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {cleanLabel(selectedMapResource.categoria)}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Provincia / Distrito
                      </span>
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 truncate block">
                        {cleanLabel(selectedMapResource.desprov || selectedMapResource.desubigeo)}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Latitud WGS-84
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 block truncate">
                        {selectedMapResource.y ? Number(selectedMapResource.y).toFixed(5) : 'N/A'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Longitud WGS-84
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 block truncate">
                        {selectedMapResource.x ? Number(selectedMapResource.x).toFixed(5) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 my-auto">
                  Selecciona un punto en el mapa para inspeccionar sus datos.
                </div>
              )}

              {/* Acciones */}
              {selectedMapResource && (
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/turismo/${createResourceSlug(selectedMapResource.nombre, selectedMapResource.codigo)}`}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider text-center shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ver Ficha Técnica Completa</span>
                    <Icons.ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CTA FINAL DE ALTO IMPACTO */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-8 sm:p-14 text-center shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              ¿Listo para Explorar el Patrimonio del Perú?
            </h2>
            <p className="text-sm sm:text-base font-semibold text-slate-900 max-w-xl mx-auto">
              Accede al catálogo interactivo con filtros oficiales de MINCETUR, coordenadas geodésicas y guías técnicas de viaje.
            </p>
            <Link
              href="/turismo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm uppercase tracking-wider shadow-2xl transition-all hover:scale-105"
            >
              <Icons.Compass className="w-5 h-5 text-amber-400" />
              <span>Explorar Catálogo Nacional de Turismo</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
