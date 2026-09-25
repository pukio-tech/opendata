'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Link, useTransitionRouter } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { Icons } from './Icons';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { apiService, getPhotoUrl } from '../services/api';
import { empresasService } from '../services/empresasApi';
import { ResourceItem } from '../types/mincetur';
import { EmpresaSuggestion } from '../types/empresa';
import { createResourceSlug } from '../utils/slug';

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

export const Navbar = () => {
  const pathname = usePathname();
  const router = useTransitionRouter();
  const { language, setLanguage, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();

  // Estados de modales y menús
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Estados de búsqueda en tiempo real
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ResourceItem[]>([]);
  const [empresaResults, setEmpresaResults] = useState<EmpresaSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResultsMenuOpen, setIsResultsMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const isHome = pathname === '/';
  const isTurismo = pathname === '/turismo';
  const isMuseos = pathname.startsWith('/museos');
  const isRutaPapa = pathname === '/ruta-del-papa';
  const isEmpresas = pathname.startsWith('/empresas');

  // Foco automático en el buscador móvil al abrir
  useEffect(() => {
    if (isMobileSearchOpen) {
      const timer = setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isMobileSearchOpen]);

  // Soporte para atajo de teclado Ctrl+K / Cmd+K y Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsResultsMenuOpen(true);
      }
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
        setIsResultsMenuOpen(false);
        setIsLangDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar dropdowns al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsResultsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsResultsMenuOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
  }, [pathname]);

  // Búsqueda en tiempo real con debounce combinando Turismo y Empresas
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setEmpresaResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [turismoRes, empRes] = await Promise.all([
          apiService.searchResources({ search: q, limit: 4 }).catch(() => ({ data: [] })),
          empresasService.suggest(q, 4).catch(() => []),
        ]);
        setSearchResults(turismoRes?.data || []);
        setEmpresaResults(empRes || []);
      } catch {
        setSearchResults([]);
        setEmpresaResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent, targetSection?: 'turismo' | 'empresas') => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsResultsMenuOpen(false);
    setIsMobileSearchOpen(false);

    if (targetSection === 'empresas') {
      router.push(`/empresas?search=${encodeURIComponent(q)}`);
      return;
    }

    if (targetSection === 'turismo') {
      router.push(`/turismo?search=${encodeURIComponent(q)}`);
      return;
    }

    // Auto-detección inteligente:
    // Si es un número (RUC) o el usuario está en /empresas
    if (/^\d{8,11}$/.test(q) || pathname.startsWith('/empresas') || (empresaResults.length > 0 && searchResults.length === 0)) {
      router.push(`/empresas?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/turismo?search=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="sticky top-0 z-[999] w-full max-w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white transition-colors duration-200 select-none shadow-sm overflow-x-clip">
      {/* ========================================================================= */}
      {/* 2. BARRA DE NAVEGACIÓN PRINCIPAL (ESTRUCTURA DE ESQUINA A ESQUINA) */}
      {/* ========================================================================= */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
        
        {/* LOGO INSTITUCIONAL Y BOTÓN DE MENÚ */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsMobileSearchOpen(false);
            }}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <Icons.X className="w-5 h-5 text-slate-900 dark:text-white" />
            ) : (
              <Icons.Menu className="w-5 h-5" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Icons.Database className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  OPEN<span className="text-sky-600 dark:text-sky-400">DATA</span>
                </span>
                <span className="hidden min-[380px]:inline-block text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 shrink-0">
                  TURISMO
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mt-1 hidden sm:block truncate">
                Inventario Turístico Nacional
              </p>
            </div>
          </Link>
        </div>

        {/* BARRA DE BÚSQUEDA TÉCNICA / DATOS (VISIBLE EN PANTALLAS GRANDES) */}
        <div className="hidden lg:flex flex-1 max-w-sm xl:max-w-md 2xl:max-w-lg relative mx-2 xl:mx-4" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <div className="relative flex items-center w-full">
              <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsResultsMenuOpen(true);
                }}
                onFocus={() => setIsResultsMenuOpen(true)}
                placeholder="Buscar por recurso, RUC o empresa..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-14 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded pointer-events-none">
                  Ctrl+K
                </span>
              )}
            </div>
          </form>

          {/* Menú desplegable de resultados tipo catálogo de datos */}
          {isResultsMenuOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 overflow-hidden">
              {isSearching && (
                <div className="p-4 text-center flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span>Buscando en Turismo y Empresas...</span>
                </div>
              )}

              {!isSearching && (empresaResults.length > 0 || searchResults.length > 0) && (
                <div className="space-y-2.5">
                  {/* SECCIÓN EMPRESAS SUNAT */}
                  {empresaResults.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                          <Icons.Building className="w-3.5 h-3.5" />
                          <span>Empresas (SUNAT)</span>
                        </span>
                        <span className="font-mono text-[10px]">{empresaResults.length}</span>
                      </div>
                      <div className="max-h-44 overflow-y-auto space-y-1 py-1">
                        {empresaResults.map((emp) => (
                          <Link
                            key={emp.ruc}
                            href={`/empresas/${emp.url_empresa || emp.ruc}`}
                            onClick={() => {
                              setIsResultsMenuOpen(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          >
                            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                              <Icons.Building className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                                {emp.razon_social}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                <span>{emp.departamento || 'Perú'}</span>
                                {emp.actividad_economica && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className="truncate">{emp.actividad_economica}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0">
                              RUC {emp.ruc}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN TURISMO */}
                  {searchResults.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Icons.Compass className="w-3.5 h-3.5" />
                          <span>Atractivos Turísticos (MINCETUR)</span>
                        </span>
                        <span className="font-mono text-[10px]">{searchResults.length}</span>
                      </div>
                      <div className="max-h-44 overflow-y-auto space-y-1 py-1">
                        {searchResults.map((item) => {
                          const itemSlug = createResourceSlug(item.nombre, item.codigo);
                          const photoUrl = item.imagen || item.foto_url || getPhotoUrl(item.codigo);
                          return (
                            <Link
                              key={item.codigo}
                              href={`/turismo/${itemSlug}`}
                              onClick={() => {
                                setIsResultsMenuOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            >
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <img
                                  src={photoUrl}
                                  alt={item.nombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=120&auto=format&fit=crop&q=60';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                                  {item.nombre}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  <span className="truncate">{cleanLabel(item.desubigeo || item.desprov || item.desdpto || 'Perú')}</span>
                                  {item.categoria && (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-600">•</span>
                                      <span className="truncate">{cleanLabel(item.categoria)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 shrink-0">
                                #{item.codigo}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Botones de redirección directa */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(undefined, 'empresas')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-center text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icons.Building className="w-3.5 h-3.5" />
                      <span>Ver en empresas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(undefined, 'turismo')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-center text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icons.Compass className="w-3.5 h-3.5" />
                      <span>Ver en turismo</span>
                    </button>
                  </div>
                </div>
              )}

              {!isSearching && empresaResults.length === 0 && searchResults.length === 0 && (
                <div className="p-4 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                    No se encontraron registros para &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prueba buscando por razón social, RUC de 11 dígitos o nombre de atractivo turístico.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ENLACES Y ACCIONES DERECHAS */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          {/* Navegación institucional seria */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
            <Link
              href="/"
              className={`py-1 transition-colors ${
                isHome
                  ? 'text-sky-600 dark:text-white border-b-2 border-sky-500 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('nav.inicio')}
            </Link>

            <Link
              href="/turismo"
              className={`py-1 transition-colors ${
                isTurismo
                  ? 'text-sky-600 dark:text-white border-b-2 border-sky-500 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('nav.turismo')}
            </Link>

            <Link
              href="/museos"
              className={`py-1 transition-colors ${
                isMuseos
                  ? 'text-sky-600 dark:text-white border-b-2 border-sky-500 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Museos
            </Link>

            <Link
              href="/empresas"
              className={`py-1 transition-colors ${
                isEmpresas
                  ? 'text-sky-600 dark:text-white border-b-2 border-sky-500 font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Empresas
            </Link>

            <Link
              href="/ruta-del-papa"
              className={`py-1 transition-colors flex items-center gap-1.5 ${
                isRutaPapa
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 font-bold'
                  : 'hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Ruta del Papa</span>
            </Link>
          </nav>

          {/* Controles de Utilidad (Idioma, Búsqueda móvil y Tema) */}
          <div className="flex items-center gap-1.5 sm:gap-2 sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-4 lg:pl-6">
            {/* Botón de Búsqueda Móvil */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                setIsMobileMenuOpen(false);
              }}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Buscar en inventario"
              aria-label={isMobileSearchOpen ? 'Cerrar búsqueda' : 'Buscar en inventario'}
              aria-expanded={isMobileSearchOpen}
            >
              {isMobileSearchOpen ? (
                <Icons.X className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              ) : (
                <Icons.Search className="w-4 h-4" />
              )}
            </button>

            {/* Selector de Idioma Formal (Visible en pantallas medianas y grandes sm:block) */}
            <div className="hidden sm:block relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer shadow-sm"
                aria-label={t('nav.selectLang')}
              >
                <Icons.Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{language}</span>
                <Icons.ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-xl z-50 text-xs">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-left transition-colors cursor-pointer ${
                        language === lang.code
                          ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{lang.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alternador de Tema Discreto */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema"
            >
              {isDark ? (
                <Icons.Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Icons.Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BÚSQUEDA DESPLEGABLE EN MÓVIL (CON RESULTADOS EN TIEMPO REAL) */}
      {/* ========================================================================= */}
      {isMobileSearchOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 shadow-lg animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center w-full">
              <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por recurso, RUC o empresa..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Resultados en tiempo real para móvil */}
          {searchQuery.trim() && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              {isSearching && (
                <div className="p-3 text-center flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span>Buscando en Turismo y Empresas...</span>
                </div>
              )}

              {!isSearching && (empresaResults.length > 0 || searchResults.length > 0) && (
                <div className="space-y-3">
                  {/* SECCIÓN EMPRESAS SUNAT MÓVIL */}
                  {empresaResults.length > 0 && (
                    <div>
                      <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                          <Icons.Building className="w-3.5 h-3.5" />
                          <span>Empresas (SUNAT)</span>
                        </span>
                        <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{empresaResults.length}</span>
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1 py-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                        {empresaResults.map((emp) => (
                          <Link
                            key={emp.ruc}
                            href={`/empresas/${emp.url_empresa || emp.ruc}`}
                            onClick={() => {
                              setIsMobileSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                              <Icons.Building className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                                {emp.razon_social}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                <span>{emp.departamento || 'Perú'}</span>
                                {emp.actividad_economica && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className="truncate">{emp.actividad_economica}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0">
                              {emp.ruc}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN TURISMO MÓVIL */}
                  {searchResults.length > 0 && (
                    <div>
                      <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Icons.Compass className="w-3.5 h-3.5" />
                          <span>Atractivos Turísticos (MINCETUR)</span>
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{searchResults.length}</span>
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1 py-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                        {searchResults.map((item) => {
                          const itemSlug = createResourceSlug(item.nombre, item.codigo);
                          const photoUrl = item.imagen || item.foto_url || getPhotoUrl(item.codigo);
                          return (
                            <Link
                              key={item.codigo}
                              href={`/turismo/${itemSlug}`}
                              onClick={() => {
                                setIsMobileSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <img
                                  src={photoUrl}
                                  alt={item.nombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=120&auto=format&fit=crop&q=60';
                                  }}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                                  {item.nombre}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  <span className="truncate">{cleanLabel(item.desubigeo || item.desprov || item.desdpto || 'Perú')}</span>
                                  {item.categoria && (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-600">•</span>
                                      <span className="truncate">{cleanLabel(item.categoria)}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 shrink-0">
                                #{item.codigo}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Acciones Rápidas */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(undefined, 'empresas')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-center text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icons.Building className="w-3.5 h-3.5" />
                      <span>Ver empresas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(undefined, 'turismo')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icons.Compass className="w-3.5 h-3.5" />
                      <span>Ver turismo</span>
                    </button>
                  </div>
                </div>
              )}

              {!isSearching && empresaResults.length === 0 && searchResults.length === 0 && (
                <div className="p-3 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                    No se encontraron registros
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prueba buscando por razón social, RUC o atractivo turístico.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MENÚ MÓVIL INSTITUCIONAL */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-3 shadow-xl animate-fadeIn">
          {/* Navegación Principal con Iconos */}
          <nav className="space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                isHome
                  ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icons.Database className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>{t('nav.inicio')}</span>
            </Link>

            <Link
              href="/turismo"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                isTurismo
                  ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icons.Compass className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>{t('nav.turismo')}</span>
            </Link>

            <Link
              href="/museos"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                isMuseos
                  ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icons.Building className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>Museos del Perú</span>
            </Link>

            <Link
              href="/empresas"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                isEmpresas
                  ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icons.Building className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>Directorio de Empresas</span>
            </Link>

            <Link
              href="/ruta-del-papa"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                isRutaPapa
                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icons.Award className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Ruta del Papa León XIV</span>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            </Link>

            <Link
              href="/#mapa-preview"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Icons.MapPin className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Geoportal Turístico Nacional</span>
            </Link>
          </nav>

          {/* Selector de Idioma en Móvil */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                {t('nav.selectLang')}
              </span>
              <Icons.Globe className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {LANGUAGES.map((lang) => {
                const isActive = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-center transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-600/20 border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{lang.code}</span>
                    <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 truncate max-w-full">
                      {lang.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pie de Menú: Tema y Estado Oficial */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-[11px] font-medium">Inventario Oficial</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              {isDark ? (
                <>
                  <Icons.Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Icons.Moon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Backdrop para cerrar al hacer clic afuera en móvil */}
      {(isMobileMenuOpen || isMobileSearchOpen) && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[-1] md:hidden"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsMobileSearchOpen(false);
          }}
        />
      )}
    </header>
  );
};
