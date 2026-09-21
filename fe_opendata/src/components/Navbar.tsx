'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Icons } from './Icons';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
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
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  // Estados de idiomas y menú móvil
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Estados de búsqueda en línea directa (sin modal)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ResourceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResultsMenuOpen, setIsResultsMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isHome = pathname === '/';
  const isTurismo = pathname === '/turismo';

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
        if (!searchQuery.trim()) {
          setIsSearchExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsResultsMenuOpen(false);
    setIsSearchExpanded(false);
    setSearchQuery('');
  }, [pathname]);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const trimmed = searchQuery.trim();
        const codeFilter = !isNaN(Number(trimmed)) ? Number(trimmed) : undefined;
        const res = await apiService.searchResources({
          q: trimmed,
          codigo: codeFilter,
          limit: 6,
        });
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Error en búsqueda inline:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Manejar envío de búsqueda con Enter
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsResultsMenuOpen(false);
    setIsSearchExpanded(false);
    router.push(`/turismo?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? (
              <Icons.X className="w-5 h-5" />
            ) : (
              <Icons.Sliders className="w-5 h-5 rotate-90" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <Icons.Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1">
                OPEN<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400">DATA</span>
              </span>
              <p className="hidden xs:block text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold truncate max-w-[150px] sm:max-w-none">
                {t('nav.portalNacional')}
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link
            href="/"
            className={`relative py-1.5 transition-colors font-semibold ${
              isHome
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>{t('nav.inicio')}</span>
            {isHome && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
            )}
          </Link>

          <Link
            href="/turismo"
            className={`relative py-1.5 transition-colors font-medium ${
              isTurismo
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>{t('nav.turismo')}</span>
            {isTurismo && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
            )}
          </Link>
        </nav>

        {/* Right Action Controls: Language (Sin contorno) + Divider | + Buscador Inline con Menú Desplegable */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Selector (Sin contorno) */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-transparent text-slate-200 hover:text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer outline-none border-0"
              aria-label={t('nav.selectLang')}
              aria-expanded={isLangDropdownOpen}
            >
              <span>{language}</span>
              <Icons.ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Language Dropdown Menu */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl shadow-black/80 z-50 animate-scaleUp">
                <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {t('nav.selectLang')}
                </div>
                {LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{lang.label}</span>
                        <span className="text-[11px] opacity-80 font-normal">{lang.name}</span>
                      </div>
                      {isSelected && (
                        <Icons.CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-slate-700/80 mx-0.5 sm:mx-1" />

          {/* Buscador Inline Directo (Escribir ahí nomás y listar resultados como un menú) */}
          <div className="relative" ref={searchContainerRef}>
            {!isSearchExpanded ? (
              <button
                type="button"
                onClick={() => {
                  setIsSearchExpanded(true);
                  setIsResultsMenuOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all hover:scale-105 active:scale-95"
                title={t('nav.buscar')}
                aria-label={t('nav.buscar')}
              >
                <Icons.Search className="w-5 h-5" />
              </button>
            ) : (
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/90 rounded-full px-3 py-1 shadow-inner animate-scaleUp"
              >
                <Icons.Search className="w-4 h-4 text-sky-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsResultsMenuOpen(true);
                  }}
                  onFocus={() => setIsResultsMenuOpen(true)}
                  placeholder={t('search.placeholder')}
                  className="bg-transparent text-white text-xs placeholder-slate-400 focus:outline-none w-36 sm:w-60 md:w-72"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-0.5 text-slate-400 hover:text-white rounded-full transition-colors"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setIsResultsMenuOpen(false);
                    }}
                    className="p-0.5 text-slate-400 hover:text-white rounded-full transition-colors"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            )}

            {/* Menú Flotante de Resultados de Búsqueda Directa */}
            {isSearchExpanded && isResultsMenuOpen && searchQuery.trim() && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/90 p-2 z-50 animate-scaleUp overflow-hidden">
                {/* Cargando */}
                {isSearching && (
                  <div className="p-4 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span>{t('turismo.loading')}</span>
                  </div>
                )}

                {/* Si hay resultados de búsqueda */}
                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between items-center">
                      <span>Destinos Encontrados</span>
                      <span className="font-mono text-sky-400">{searchResults.length} resultados</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1 py-1">
                      {searchResults.map((item) => {
                        const itemSlug = createResourceSlug(item.nombre, item.codigo);
                        return (
                          <Link
                            key={item.codigo}
                            href={`/turismo/${itemSlug}`}
                            onClick={() => {
                              setIsResultsMenuOpen(false);
                              setIsSearchExpanded(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/80 transition-colors group"
                          >
                            {/* Mini Thumbnail */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                              <img
                                src={item.imagen || getPhotoUrl(item.codigo)}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                {item.nombre}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                {item.desubigeo || item.desprov || item.desdpto || 'Perú'}
                              </p>
                            </div>

                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                              #{item.codigo}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Botón Ver todos */}
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full mt-1 pt-2 pb-1.5 px-3 border-t border-slate-800 text-center text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>{t('search.exploreAll')}</span>
                      <Icons.ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Si no se encontraron resultados */}
                {!isSearching && searchResults.length === 0 && (
                  <div className="p-4 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-300">
                      No se encontraron recursos para &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Intenta con otra palabra clave o presiona Enter para ver el catálogo general.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1 animate-fadeIn">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isHome ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {t('nav.inicio')}
          </Link>
          <Link
            href="/turismo"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isTurismo ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {t('nav.turismo')}
          </Link>
        </div>
      )}
    </header>
  );
};
