'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    onClose();
    router.push(`/turismo?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const popularSearches = [
    t('search.popular1'),
    t('search.popular2'),
    t('search.popular3'),
    t('search.popular4'),
    t('search.popular5'),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-lg shadow-card overflow-hidden z-10 backdrop-blur-md animate-scaleUp">
        {/* Search input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex items-center gap-3 px-6 py-4 border-b border-slate-800"
        >
          <Icons.Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent text-white placeholder-slate-400 text-base sm:text-lg focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            ESC
          </button>
        </form>

        {/* Quick Suggestions & Options */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
            <span>{t('search.popular')}</span>
            <span className="text-[11px] text-slate-500">{t('search.pressEnter')}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {popularSearches.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSearch(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 text-xs font-mono transition-colors cursor-pointer"
              >
                <Icons.Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>{item}</span>
              </button>
            ))}
          </div>

          {/* Action button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push('/turismo');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.Sliders className="w-3.5 h-3.5" />
              <span>{t('nav.busquedaAvanzada')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSearch(query || 'Perú')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <span>{t('search.exploreAll')}</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
