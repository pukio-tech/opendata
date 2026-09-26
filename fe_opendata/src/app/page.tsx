'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useTransitionRouter } from 'next-view-transitions';
import dynamic from 'next/dynamic';
import { Icons } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { CustomSelect, SelectOption } from '../components/CustomSelect';
import { ResourceCard } from '../components/ResourceCard';
import { apiService, getPhotoUrl } from '../services/api';
import { DepartmentItem, CategoryItem, ActivityItem, ResourceItem } from '../types/mincetur';
import { createResourceSlug } from '../utils/slug';
import { translateMinceturText, formatResourceCardDescription } from '../utils/minceturTranslate';
import { DynamicText } from '../utils/dynamicTranslate';
import { AdsterraNativeBanner } from '../components/AdsterraNativeBanner';
import { AdsterraDisplayBanner, ResponsiveLeaderboard } from '../components/AdsterraDisplayBanner';
import { InstitutionalImage } from '../components/InstitutionalImage';
import { OfficialBadge } from '../components/OfficialBadge';
import { TrustVerificationBadge, OfficialSealBadge } from '../components/TrustVerificationBadge';

const OpenStreetMap = dynamic(
  () => import('../components/OpenStreetMap').then((mod) => mod.OpenStreetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[460px] sm:min-h-[520px] rounded-xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-xs border border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
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

const DEFAULT_HERO_BG =
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1280&q=70';
const FALLBACK_CARD_BG =
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=500&q=70';

export default function HomePage() {
  const router = useTransitionRouter();
  const { language, t } = useLanguage();

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

  // Filtros del Hero Search
  const [heroSearch, setHeroSearch] = useState<string>('');
  const [heroDept, setHeroDept] = useState<string>('');
  const [heroCategory, setHeroCategory] = useState<string>('');

  // Estado del selector de departamento en el mapa interactivo
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Slider de fondos del Hero
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isSliderPaused, setIsSliderPaused] = useState<boolean>(false);

  // Recurso seleccionado para el mapa
  const [selectedMapResource, setSelectedMapResource] = useState<ResourceItem | null>(null);

  // Estado para botón de copiar enlace al compartir
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const handleCopyShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

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
  // 2. CARGA DINÁMICA DE DESTINOS DESTACADOS DESDE LA API (6 REGISTROS)
  // =========================================================================
  useEffect(() => {
    setLoadingFeatured(true);
    apiService
      .getFeaturedResources({
        limit: 8,
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
        limit: 60,
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

  // Opciones de Departamentos formateadas para Selects
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

  // Opciones de Categorías formateadas para Selects
  const categoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: `${t('turismo.allCategories')} (${categories.length})` },
      ...categories.map((c) => ({
        value: String(c.atrac_categ),
        label: translateMinceturText(c.categoria, language),
      })),
    ];
  }, [categories, language, t]);

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

  // Handler de búsqueda desde el Hero
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroSearch.trim()) params.set('search', heroSearch.trim());
    if (heroDept) params.set('department', heroDept);
    if (heroCategory) params.set('category', heroCategory);
    router.push(`/turismo?${params.toString()}`);
  };

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION INSTITUCIONAL DE DATOS ABIERTOS */}
      {/* ========================================================================= */}
      <section
        className="relative min-h-[85vh] flex flex-col justify-between pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-950"
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
      >
        {/* Fondo con Fotos Oficiales de la API y Overlay */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          {featuredResources.length === 0 ? (
            <div className="absolute inset-0 opacity-100 scale-100">
              <img
                src={DEFAULT_HERO_BG}
                alt="Turismo Perú"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[0.5px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" />
            </div>
          ) : (
            featuredResources.slice(0, 5).map((resource, idx) => {
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
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={idx === 0 ? 'high' : 'low'}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_HERO_BG;
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[0.5px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" />
                </div>
              );
            })
          )}
        </div>

        {/* Barra superior de Estado y Metadatos de la Imagen */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <OfficialSealBadge source="MINCETUR • SUNAT • IRTP" />

          {activeHeroItem && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 font-mono backdrop-blur-md shadow-xs">
              <Icons.MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-white font-medium">{cleanLabel(activeHeroItem.nombre)}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{cleanLabel(activeHeroItem.desdpto)}</span>
              <OfficialBadge variant="code">
                #{activeHeroItem.codigo}
              </OfficialBadge>
            </div>
          )}
        </div>

        {/* Titular Principal & Consola de Búsqueda de Datos */}
        <div className="relative z-10 max-w-5xl mx-auto text-center my-auto py-8 w-full">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            {t('hero.title1')}{' '}
            <span className="text-white">
              {t('hero.titlePeru')}
            </span>
          </h1>

          <p className="mt-3 text-xs sm:text-base text-slate-200 font-normal max-w-3xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Consola Técnica de Búsqueda y Filtros de Entrada */}
          <div className="mt-8 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 shadow-xs backdrop-blur-md text-left transition-colors">
            <form onSubmit={handleHeroSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Campo de búsqueda textual */}
                <div className="md:col-span-4 relative">
                  <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder={t('turismo.searchPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] font-sans transition-colors"
                  />
                </div>

                {/* Filtro por Departamento */}
                <div className="md:col-span-3 min-w-0">
                  <CustomSelect
                    label=""
                    icon={<Icons.MapPin className="w-3.5 h-3.5 text-slate-400" />}
                    value={heroDept}
                    onChange={setHeroDept}
                    options={departmentOptions}
                    placeholder={t('turismo.allRegions')}
                    searchable
                    variant="default"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:border-slate-400 flex items-center justify-between text-xs sm:text-sm transition-colors"
                  />
                </div>

                {/* Filtro por Categoría */}
                <div className="md:col-span-3 min-w-0">
                  <CustomSelect
                    label=""
                    icon={<Icons.Layers className="w-3.5 h-3.5 text-slate-400" />}
                    value={heroCategory}
                    onChange={setHeroCategory}
                    options={categoryOptions}
                    placeholder={t('turismo.allCategories')}
                    searchable
                    variant="default"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:border-slate-400 flex items-center justify-between text-xs sm:text-sm transition-colors"
                  />
                </div>

                {/* Botón de Consulta */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 sm:py-2.5 px-4 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Icons.Search className="w-4 h-4" />
                    <span>{t('turismo.btnSearch')}</span>
                  </button>
                </div>
              </div>

              {/* Atajos de búsqueda rápida institucional */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-mono text-slate-500 uppercase">{t('search.popular')}</span>
                <button
                  type="button"
                  onClick={() => router.push('/turismo?category=1')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
                >
                  {t('hero.catNatural')}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/turismo?category=2')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
                >
                  {t('hero.catCultural')}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/turismo?category=3')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
                >
                  {t('hero.catFolklore')}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/turismo?department=08')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
                >
                  Cusco
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/turismo?department=04')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
                >
                  Arequipa
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/turismo?department=02')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
                >
                  Áncash
                </button>
              </div>
            </form>
          </div>

          {/* Cuadrícula de Indicadores Cuantitativos Oficiales (Estilo Estadística Oficial, Unicolor) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto mt-6 text-left">
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">{t('home.totalResources')}</span>
                <Icons.Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
                {totalResourcesCount > 0 ? totalResourcesCount.toLocaleString() : '2,291'}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{t('home.inventoryNational')}</span>
              </div>
            </div>

            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">{t('home.naturalSites')}</span>
                <Icons.Trees className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
                {naturalCount > 0 ? naturalCount.toLocaleString() : '1,080'}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>{t('home.cat1Natural')}</span>
              </div>
            </div>

            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">{t('home.culturalHeritage')}</span>
                <Icons.Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
                {culturalCount > 0 ? culturalCount.toLocaleString() : '840'}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>{t('home.cat2Cultural')}</span>
              </div>
            </div>

            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">{t('home.folkloreTraditions')}</span>
                <Icons.Award className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
                {folkloreCount > 0 ? folkloreCount.toLocaleString() : '240'}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span>{t('home.cat3Folklore')}</span>
              </div>
            </div>
          </div>

          {/* Banner Leaderboard Responsivo dentro de la sección azul / Hero */}
          <div className="mt-6 flex justify-center w-full">
            <ResponsiveLeaderboard />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BARRA DE COMPARTIR Y DIFUSIÓN EN REDES SOCIALES */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
            <Icons.Share className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold text-slate-900 dark:text-white">Compartir plataforma:</span>
            <span className="hidden sm:inline text-slate-500">Difunde los datos abiertos oficiales del Perú</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://api.whatsapp.com/send?text=Descubre%20los%20recursos%20tur%C3%ADsticos%20y%20empresas%20del%20Per%C3%BA%20en%20OpenData%20Per%C3%BA%3A%20https%3A%2F%2Fopendata.pukio.lat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en WhatsApp"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors font-semibold"
            >
              <Icons.WhatsApp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>

            <a
              href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fopendata.pukio.lat&text=Descubre%20los%20recursos%20tur%C3%ADsticos%20y%20empresas%20del%20Per%C3%BA%20en%20OpenData%20Per%C3%BA"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en X (Twitter)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              <Icons.Twitter className="w-3.5 h-3.5" />
              <span className="hidden md:inline">X (Twitter)</span>
            </a>

            <a
              href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fopendata.pukio.lat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en LinkedIn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors font-semibold"
            >
              <Icons.LinkedIn className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span className="hidden md:inline">LinkedIn</span>
            </a>

            <a
              href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fopendata.pukio.lat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en Facebook"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors font-semibold"
            >
              <Icons.Facebook className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Facebook</span>
            </a>

            <button
              type="button"
              onClick={handleCopyShare}
              aria-label="Copiar enlace de OpenData Perú"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <Icons.Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Icons.Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copiar Enlace</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATÁLOGO DE REGISTROS DESTACADOS */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1.5">
              <Icons.Compass className="w-4 h-4" />
              <span>{t('home.featuredBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('home.featuredTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('home.featuredSubtitle')}
            </p>
          </div>

          <Link
            href="/turismo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors self-start sm:self-auto shrink-0 shadow-sm"
          >
            <span>{t('home.viewAllCatalog')}</span>
            <Icons.ArrowRight className="w-3.5 h-3.5 text-sky-500" />
          </Link>
        </div>

        {/* Cuadrícula de Destinos Reales */}
        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col justify-between p-5"
              >
                <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredResources.map((item) => (
              <ResourceCard key={item.codigo} resource={item} />
            ))}
          </div>
        )}
      </section>

      {/* Banner Nativo de Publicidad Adsterra */}
      <AdsterraNativeBanner />

      {/* ========================================================================= */}
      {/* 3. GEOPORTAL NACIONAL: OPENSTREETMAP + INSPECTOR TÉCNICO */}
      {/* ========================================================================= */}
      <section id="mapa-preview" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1.5">
              <Icons.Navigation className="w-4 h-4" />
              <span>{t('home.ideBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('home.geoportalTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('home.geoportalSubtitle')}
            </p>
          </div>

          {/* Selector de Departamento para el Mapa */}
          <div className="w-full sm:w-64">
            <CustomSelect
              label=""
              icon={<Icons.MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
              value={selectedDept}
              onChange={setSelectedDept}
              options={departmentOptions}
              placeholder={t('turismo.allRegions')}
              searchable
              variant="default"
              buttonClassName="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:border-sky-500/50 flex items-center justify-between text-xs sm:text-sm shadow-sm dark:shadow-none transition-colors"
            />
          </div>
        </div>

        {/* Layout del Mapa: OpenStreetMap + Inspector Activo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Geoportal OpenStreetMap con Leaflet */}
          <div className="lg:col-span-7 flex flex-col min-h-[460px] sm:min-h-[520px] rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <OpenStreetMap
              resources={mapResources}
              selectedResource={selectedMapResource}
              onSelectResource={setSelectedMapResource}
            />
          </div>

          {/* Inspector del Recurso Seleccionado */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 h-full flex flex-col justify-between shadow-sm dark:shadow-none transition-colors">
              {selectedMapResource ? (
                <div>
                  {/* Foto del recurso activo en el mapa con fallback institucional consistente */}
                  <div className="relative h-44 sm:h-48 w-full rounded-lg overflow-hidden mb-3 border border-slate-200 dark:border-slate-800">
                    <InstitutionalImage
                      src={selectedMapResource.imagen || selectedMapResource.foto_url || getPhotoUrl(selectedMapResource.codigo)}
                      alt={selectedMapResource.nombre}
                      category={cleanLabel(selectedMapResource.categoria) || 'Recurso Turístico'}
                      code={selectedMapResource.codigo}
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900/90 text-white border border-slate-700">
                        {cleanLabel(selectedMapResource.desdpto)}
                      </span>
                      <OfficialBadge variant="code">
                        #{selectedMapResource.codigo}
                      </OfficialBadge>
                    </div>
                  </div>

                  {/* Señal de verificación y estado en geoportal */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>{t('home.activeInGeoportal')}</span>
                    </div>
                    <TrustVerificationBadge
                      source="MINCETUR"
                      seedId={selectedMapResource.codigo}
                    />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                    {cleanLabel(selectedMapResource.nombre)}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {formatResourceCardDescription(selectedMapResource, language)}
                  </p>

                  {/* Cuadrícula de Datos Técnicos */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4 text-left font-mono">
                    <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('home.category')}
                      </span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block">
                        <DynamicText text={translateMinceturText(selectedMapResource.categoria, language)} />
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('home.provinceDistrict')}
                      </span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block">
                        {cleanLabel(selectedMapResource.desprov || selectedMapResource.desubigeo)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('home.latitude')}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                        {selectedMapResource.y ? Number(selectedMapResource.y).toFixed(5) : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('home.longitude')}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                        {selectedMapResource.x ? Number(selectedMapResource.x).toFixed(5) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 my-auto font-mono text-xs">
                  {t('home.selectMarkerMap')}
                </div>
              )}

              {/* Acciones */}
              {selectedMapResource && (
                <div className="pt-2">
                  <Link
                    href={`/turismo/${createResourceSlug(selectedMapResource.nombre, selectedMapResource.codigo)}`}
                    className="w-full py-2.5 px-4 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>{t('home.viewFullTechSheet')}</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Banner Publicitario 468x60 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4 flex justify-center">
        <AdsterraDisplayBanner size="468x60" />
      </div>

      {/* ========================================================================= */}
      {/* 4. BANNER INSTITUCIONAL DE DATOS ABIERTOS */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-400">
              <Icons.Database className="w-4 h-4" />
              <span className="uppercase tracking-wider font-semibold">{t('home.openDbBadge')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t('home.bannerTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {t('home.bannerDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/turismo"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center shadow-sm"
            >
              <Icons.Search className="w-4 h-4" />
              <span>{t('home.exploreCatalog')}</span>
            </Link>
            <Link
              href="/#mapa-preview"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 text-center shadow-sm dark:shadow-none"
            >
              <Icons.Navigation className="w-4 h-4 text-sky-500" />
              <span>{t('home.viewGeoportal')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INFORMACIÓN OFICIAL DE RECURSOS TURÍSTICOS Y EMPRESAS DEL PERÚ */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2">
            <Icons.ShieldCheck className="w-4 h-4" />
            <span>Portal Oficial de Datos Abiertos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Descubre los Recursos Turísticos y Empresas del Perú
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            OpenData Perú es la plataforma libre de consulta ciudadana y análisis técnico que centraliza los datos abiertos del patrimonio turístico nacional (MINCETUR), el directorio empresarial formal obtenido de la Plataforma Nacional de Datos Abiertos (gob.pe/datosabiertos) y el cronograma oficial de la Ruta del Papa León XIV (IRTP / Presidencia de la República).
          </p>
        </div>

        {/* 4 Bloques Temáticos de Contenido Enriquecido */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Bloque 1: Turismo MINCETUR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Icons.Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Inventario Turístico Nacional
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Consulta más de 4,800 recursos turísticos del Perú registrados oficialmente ante el MINCETUR. Incluye sitios arqueológicos milenarios, reservas naturales, festividades folclóricas, gastronomía tradicional y patrimonio de las 25 regiones con fichas técnicas y coordenadas oficiales.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                Fuente: MINCETUR
              </span>
            </div>
          </div>

          {/* Bloque 2: Empresas gob.pe/datosabiertos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Icons.Building className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Directorio Oficial de Empresas
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Accede al directorio público de más de 32,100 empresas peruanas obtenido de la Plataforma Nacional de Datos Abiertos (gob.pe/datosabiertos) y la SUNAT. Verifica al instante la razón social, número de RUC de 11 dígitos, estado, condición fiscal y actividad económica CIIU Rev. 4.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Fuente: gob.pe/datosabiertos
              </span>
            </div>
          </div>

          {/* Bloque 3: Ruta del Papa León XIV */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Icons.Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ruta del Papa León XIV
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sigue el itinerario oficial de la visita apostólica del Papa León XIV en el Perú, publicado por el Instituto Nacional de Radio y Televisión del Perú (IRTP) y la Presidencia de la República. Cronograma detallado, sedes litúrgicas y mapa interactivo en 6 departamentos.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                Fuente: IRTP / Gob.pe
              </span>
            </div>
          </div>

          {/* Bloque 4: Geoportal Espacial Interactivo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icons.MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Geoportal Espacial Interactivo
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Explora la infraestructura de datos espaciales con coordenadas geodésicas de precisión en el sistema WGS-84 (EPSG:4326). Los datos están abiertos en formatos interoperables (JSON y GeoJSON) bajo licenciamiento Creative Commons para su reutilización responsable.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                Estándar OGC & EPSG:4326
              </span>
            </div>
          </div>
        </div>

        {/* Guía Rápida y Preguntas Frecuentes (FAQ) */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Preguntas Frecuentes sobre la Plataforma
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Respuestas directas sobre la procedencia de los datos, actualización y modalidades de consulta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>¿De dónde provienen los datos publicados en OpenData Perú?</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 pl-3">
                Los datos provienen de fuentes oficiales del Estado Peruano: el catálogo de recursos turísticos se obtiene del <strong>MINCETUR</strong> (<a href="https://consultasenlinea.mincetur.gob.pe" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">consultasenlinea.mincetur.gob.pe</a>), el directorio de empresas procede de la <strong>Plataforma Nacional de Datos Abiertos</strong> (<a href="https://www.gob.pe/datosabiertos" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">gob.pe/datosabiertos</a>) y la SUNAT, y la Ruta del Papa León XIV proviene del programa oficial publicado por el <strong>IRTP</strong> y la Presidencia de la República (<a href="https://www.gob.pe/institucion/irtp/noticias/1446972-papa-leon-xiv-en-peru-conoce-el-programa-oficial-de-actividades-del-santo-padre-durante-su-visita-a-nuestro-pais" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">gob.pe/irtp</a>).
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>¿Cómo puedo buscar información por región o código RUC?</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 pl-3">
                Puedes utilizar la barra de búsqueda universal en la cabecera para ingresar un código RUC de 11 dígitos, nombre de empresa o atractivo turístico. También puedes navegar por los 25 departamentos del Perú utilizando los selectores y mapas interactivos.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>¿Es necesario registrarse o pagar para consultar los datos?</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 pl-3">
                No. El acceso a OpenData Perú es 100% gratuito, anónimo y público. No se requiere crear cuenta, no recopilamos datos personales sensibles y fomentamos el uso de datos abiertos para el desarrollo nacional.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>¿Cómo citar o reutilizar los datos en investigaciones?</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 pl-3">
                La información se distribuye bajo el estándar de datos abiertos CC-BY. Se recomienda citar a OpenData Perú y las fuentes primarias institucionales (MINCETUR, gob.pe/datosabiertos, SUNAT e IRTP) en informes, publicaciones académicas o herramientas tecnológicas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
