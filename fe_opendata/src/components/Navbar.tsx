'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from './Icons';

export const Navbar = () => {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isTurismo = pathname?.startsWith('/turismo');

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform">
            <Icons.Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              OPEN<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400">DATA</span>
            </span>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Portal Nacional de Turismo</p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
          <Link
            href="/"
            className={`transition-colors flex items-center gap-1.5 ${
              isHome ? 'text-sky-400 border-b-2 border-sky-400 py-1' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Inicio</span>
          </Link>

          <Link
            href="/turismo"
            className={`transition-colors flex items-center gap-1.5 ${
              isTurismo ? 'text-sky-400 border-b-2 border-sky-400 py-1' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Icons.Compass className="w-4 h-4 text-amber-400" />
            <span>Turismo</span>
          </Link>

          <Link
            href="/turismo#busqueda-avanzada"
            className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Icons.Sliders className="w-4 h-4 text-sky-400" />
            <span>Búsqueda Avanzada</span>
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/turismo"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Icons.Compass className="w-4 h-4" />
            <span>Ir a Turismo</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
