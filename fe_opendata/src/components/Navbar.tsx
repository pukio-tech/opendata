'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Link, useTransitionRouter } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { Icons } from './Icons';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { apiService, getPhotoUrl } from '../services/api';
import { ResourceItem } from '../types/mincetur';
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
  const [isSearching, setIsSearching] = useState(false);
  const [isResultsMenuOpen, setIsResultsMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isHome = pathname === '/';
  const isTurismo = pathname === '/turismo';
  const isRutaPapa = pathname === '/ruta-del-papa';

  // Soporte para atajo de teclado Ctrl+K o Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsResultsMenuOpen(true);
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

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      apiService
        .searchResources({
          search: searchQuery.trim(),
          limit: 6,
        })
        .then((res) => {
          setSearchResults(res.data || []);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsResultsMenuOpen(false);
    setIsMobileSearchOpen(false);
    router.push(`/turismo?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-[999] w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white transition-colors duration-200 select-none shadow-sm">
      {/* ========================================================================= */}
      {/* 2. BARRA DE NAVEGACIÓN PRINCIPAL (ESTRUCTURA INSTITUCIONAL) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* LOGO INSTITUCIONAL */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Abrir menú de navegación"
          >
            {isMobileMenuOpen ? (
              <Icons.X className="w-5 h-5" />
            ) : (
              <Icons.Sliders className="w-5 h-5 rotate-90" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
              <Icons.Database className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 leading-none">
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  OPEN<span className="text-sky-600 dark:text-sky-400">DATA</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
                  TURISMO
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mt-1 hidden xs:block">
                Inventario Turístico Nacional
              </p>
            </div>
          </Link>
        </div>

        {/* BARRA DE BÚSQUEDA TÉCNICA / DATOS (VISIBLE EN PANTALLAS GRANDES) */}
        <div className="hidden lg:flex flex-1 max-w-md relative" ref={searchContainerRef}>
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
                placeholder="Buscar por recurso, ubigeo o código..."
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 z-50 overflow-hidden">
              {isSearching && (
                <div className="p-4 text-center flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span>Consultando inventario nacional...</span>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span>Resultados Oficiales</span>
                    <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{searchResults.length} registros</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1 py-1">
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
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
                                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{cleanLabel(item.categoria)}</span>
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

                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="w-full mt-1 pt-2 pb-1 px-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Ver todos los resultados en el catálogo</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && (
                <div className="p-4 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                    No se encontraron registros para &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Presiona Enter para buscar coincidencias parciales en el catálogo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ENLACES Y ACCIONES DERECHAS */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Navegación institucional seria */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
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
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-4">
            {/* Botón de Búsqueda Móvil */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Buscar en inventario"
            >
              <Icons.Search className="w-4 h-4" />
            </button>

            {/* Selector de Idioma Formal */}
            <div className="relative" ref={langDropdownRef}>
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
      {/* 3. BÚSQUEDA DESPLEGABLE EN MÓVIL */}
      {/* ========================================================================= */}
      {isMobileSearchOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar recurso, ubigeo o código..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MENÚ MÓVIL INSTITUCIONAL */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1 animate-fadeIn">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isHome ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('nav.inicio')}
          </Link>

          <Link
            href="/turismo"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isTurismo ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('nav.turismo')}
          </Link>

          <Link
            href="/ruta-del-papa"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isRutaPapa ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🇻🇦 Ruta del Papa León XIV
          </Link>

          <Link
            href="/#mapa-preview"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Geoportal Turístico Nacional
          </Link>

          <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Inventario Nacional</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              {isDark ? <Icons.Sun className="w-3.5 h-3.5 text-amber-400" /> : <Icons.Moon className="w-3.5 h-3.5 text-sky-600" />}
              <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
