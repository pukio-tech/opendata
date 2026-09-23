'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Icons } from './Icons';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  label?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  variant?: 'glass' | 'default';
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  searchable = false,
  className = '',
  buttonClassName = '',
  variant = 'glass',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectId = useId();

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // Filtered options based on search query
  const filteredOptions = searchQuery.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const isGlass = variant === 'glass';

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form accessibility & state */}
      <input type="hidden" name={label} value={value} />

      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-left transition-all duration-200 cursor-pointer outline-none ${
          buttonClassName
            ? buttonClassName
            : isGlass
            ? 'glass-search-field p-3 sm:p-3.5 rounded-2xl text-white'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-xl text-slate-900 dark:text-white shadow-sm hover:border-sky-500/50'
        } ${isOpen ? 'ring-2 ring-sky-400/40 border-sky-400/80 shadow-glass-glow' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {label && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 text-amber-400 dark:text-amber-400">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="truncate">{label}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 min-w-0 w-full">
          <div className="flex items-center gap-2 truncate min-w-0">
            {!label && icon && <span className="text-slate-400 shrink-0">{icon}</span>}
            <span
              className={`text-xs sm:text-sm font-semibold truncate ${
                selectedOption
                  ? isGlass
                    ? 'text-white'
                    : 'text-slate-900 dark:text-white'
                  : 'text-slate-400 dark:text-slate-400 font-normal'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <Icons.ChevronDown
            className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-sky-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-[80] left-0 right-0 mt-2 min-w-[240px] max-h-72 overflow-hidden rounded-2xl backdrop-blur-2xl shadow-2xl animate-scaleUp p-1.5 flex flex-col ${
            isGlass
              ? 'bg-slate-900/95 border border-slate-700/80 shadow-black/80'
              : 'bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-slate-400/25 dark:shadow-black/80 text-slate-900 dark:text-white'
          }`}
        >
          {/* Optional Search Bar */}
          {searchable && (
            <div className={`p-1.5 pb-2 border-b ${isGlass ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}>
              <div
                className={`relative flex items-center rounded-xl px-2.5 py-1.5 border focus-within:border-sky-400 ${
                  isGlass
                    ? 'bg-slate-950/80 border-slate-700/60'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <Icons.Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar opción..."
                  className={`w-full bg-transparent text-xs focus:outline-none ${
                    isGlass
                      ? 'text-white placeholder-slate-500'
                      : 'text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 py-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold border border-sky-500/30'
                        : isGlass
                        ? 'text-slate-200 hover:bg-slate-800/80 hover:text-white font-medium'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {option.icon && <span className="shrink-0 text-slate-400">{option.icon}</span>}
                      <div className="truncate">
                        <span className="block truncate">{option.label}</span>
                        {option.sublabel && (
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {option.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${
                            isGlass
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Icons.CheckCircle className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
